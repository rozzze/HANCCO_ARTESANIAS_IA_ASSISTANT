<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PedidoResource;
use App\Models\Pedido;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PedidoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Pedido::with(['cliente', 'detalles.producto', 'pago']);

        if ($request->filled('estado_pedido')) {
            $query->where('estado_pedido', $request->string('estado_pedido'));
        }

        if ($request->filled('cliente_id')) {
            $query->where('cliente_id', $request->integer('cliente_id'));
        }

        if ($request->filled('desde')) {
            $query->whereDate('fecha_pedido', '>=', $request->date('desde'));
        }

        if ($request->filled('hasta')) {
            $query->whereDate('fecha_pedido', '<=', $request->date('hasta'));
        }

        $perPage = min($request->integer('per_page', 25), 100);
        $pedidos = $query->latest('fecha_pedido')->paginate($perPage);

        return response()->json([
            'data' => PedidoResource::collection($pedidos),
        ]);
    }

    public function show(Pedido $pedido): JsonResponse
    {
        return response()->json([
            'data' => new PedidoResource(
                $pedido->load(['cliente', 'detalles.producto', 'pago'])
            ),
        ]);
    }

    public function update(Request $request, Pedido $pedido): JsonResponse
    {
        $data = $request->validate([
            'estado_pedido' => ['required', 'in:pendiente,pagado,enviado,entregado,cancelado'],
            'notas' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($data['estado_pedido'] === 'cancelado' && $pedido->estado_pedido !== 'cancelado') {
            foreach ($pedido->detalles as $detalle) {
                $variante = $detalle->productoTalla;

                if ($variante) {
                    $variante->increment('stock_disponible', $detalle->cantidad);
                    $variante->sincronizarProducto();
                } else {
                    $detalle->producto?->increment('stock_disponible', $detalle->cantidad);
                }
            }
        }

        $pedido->update($data);

        return response()->json([
            'message' => 'Estado del pedido actualizado.',
            'data' => new PedidoResource(
                $pedido->fresh()->load(['cliente', 'detalles.producto', 'pago'])
            ),
        ]);
    }
}