<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PagoResource;
use App\Http\Resources\PedidoResource;
use App\Models\Pago;
use App\Models\Pedido;
use App\Services\CloudflareR2Service;
use App\Services\CulqiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PagoController extends Controller
{
    public function __construct(
        protected CulqiService $culqi,
        protected CloudflareR2Service $r2,
    ) {}

    public function store(Request $request, Pedido $pedido): JsonResponse
    {
        if ($pedido->cliente_id !== $request->user()->id) {
            abort(403, 'No autorizado.');
        }

        if ($pedido->pago) {
            return response()->json([
                'message' => 'Este pedido ya tiene un pago registrado.',
            ], 422);
        }

        if ($pedido->estado_pedido === 'cancelado') {
            return response()->json([
                'message' => 'Pedido cancelado, no se puede pagar.',
            ], 422);
        }

        $data = $request->validate([
            'metodo_pago' => ['required', 'string', 'in:tarjeta,yape,plin,transferencia,contraentrega'],
            'transaccion_id' => ['nullable', 'string', 'max:120'],
            'culqi_token' => ['required_if:metodo_pago,tarjeta', 'nullable', 'string'],
            'metadata' => ['nullable', 'array'],
            'comprobante' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
        ]);

        $comprobanteUrl = null;
        if ($request->hasFile('comprobante')) {
            $subida = $this->r2->subirComprobante($request->file('comprobante'), $pedido->id);
            $comprobanteUrl = $subida['url'];
        }

        $pago = DB::transaction(function () use ($pedido, $data, $request, $comprobanteUrl) {
            $estadoInicial = 'pendiente';
            $culqiChargeId = null;
            $transaccionId = $data['transaccion_id'] ?? null;
            $metadata = $data['metadata'] ?? [];

            if ($data['metodo_pago'] === 'tarjeta') {
                $culqi = $this->culqi->crearCargo(
                    tokenId: $data['culqi_token'],
                    monto: (float) $pedido->total,
                    pedidoId: $pedido->id,
                    descripcion: "Hancco Artesanias - Pedido #{$pedido->id}",
                    correoCliente: $request->user()->correo,
                );

                $culqiChargeId = $culqi['id'] ?? null;
                $transaccionId = $culqi['reference_code'] ?? $culqiChargeId;
                $metadata['culqi'] = $culqi;

                $estadoCulqi = $culqi['state'] ?? 'expirada';
                $estadoInicial = match ($estadoCulqi) {
                    'pagado' => 'completado',
                    'rechazado', 'fallido' => 'fallido',
                    'expirada', 'pendiente' => 'pendiente',
                    default => 'pendiente',
                };
            }

            $pago = Pago::create([
                'pedido_id' => $pedido->id,
                'metodo_pago' => $data['metodo_pago'],
                'transaccion_id' => $transaccionId,
                'culqi_charge_id' => $culqiChargeId,
                'monto' => $pedido->total,
                'fecha_pago' => $estadoInicial === 'completado' ? now() : null,
                'estado_pago' => $estadoInicial,
                'comprobante_url' => $comprobanteUrl,
                'metadata' => $metadata ?: null,
            ]);

            if ($estadoInicial === 'completado') {
                $pedido->update(['estado_pedido' => 'pagado']);
            }

            return $pago;
        });

        return response()->json([
            'message' => $pago->estado_pago === 'completado' ? 'Pago registrado y confirmado.' : 'Pago registrado, pendiente de confirmacion.',
            'data' => [
                'pago' => new PagoResource($pago),
                'pedido' => new PedidoResource($pago->pedido->load(['detalles.producto.imagenes', 'pago'])),
            ],
        ], 201);
    }

    public function webhookCulqi(Request $request): JsonResponse
    {
        $payloadRaw = $request->getContent();
        $firma = $request->header('X-Culqi-Signature');

        if (! $this->culqi->validarFirmaWebhook($payloadRaw, $firma)) {
            Log::warning('Webhook Culqi con firma invalida', [
                'ip' => $request->ip(),
            ]);

            return response()->json(['message' => 'Firma invalida.'], 401);
        }

        $evento = $request->input('event') ?? $request->input('type');
        $data = $request->input('data') ?? $request->all();

        $chargeId = $data['id'] ?? $data['object']['id'] ?? null;
        $estado = $data['state'] ?? $data['object']['state'] ?? null;

        if (! $chargeId) {
            return response()->json(['message' => 'Sin charge id.'], 400);
        }

        $pago = Pago::where('culqi_charge_id', $chargeId)->first();
        if (! $pago) {
            Log::warning('Webhook Culqi: cargo no encontrado', ['charge_id' => $chargeId]);

            return response()->json(['message' => 'Cargo no encontrado.'], 404);
        }

        $nuevoEstado = match ($estado) {
            'pagado' => 'completado',
            'rechazado', 'fallido' => 'fallido',
            'reembolsado' => 'reembolsado',
            default => $pago->estado_pago,
        };

        if ($nuevoEstado !== $pago->estado_pago) {
            $pago->update([
                'estado_pago' => $nuevoEstado,
                'fecha_pago' => $nuevoEstado === 'completado' ? now() : $pago->fecha_pago,
            ]);

            if ($nuevoEstado === 'completado') {
                $pago->pedido->update(['estado_pedido' => 'pagado']);
            }
        }

        return response()->json(['message' => 'OK']);
    }
}
