<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PedidoResource;
use App\Models\CarritoCompra;
use App\Models\DetallePedido;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\ProductoTalla;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PedidoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('per_page', 15), 1), 50);

        $query = Pedido::where('cliente_id', $request->user()->id)
            ->with(['detalles.producto.imagenes', 'pago']);

        if ($request->filled('estado_pedido')) {
            $query->where('estado_pedido', $request->string('estado_pedido'));
        }

        $pedidos = $query->latest('fecha_pedido')->paginate($perPage);

        return response()->json([
            'data' => PedidoResource::collection($pedidos),
            'meta' => [
                'current_page' => $pedidos->currentPage(),
                'last_page' => $pedidos->lastPage(),
                'per_page' => $pedidos->perPage(),
                'total' => $pedidos->total(),
            ],
        ]);
    }

    public function show(Request $request, Pedido $pedido): JsonResponse
    {
        if ($pedido->cliente_id !== $request->user()->id) {
            abort(403, 'No autorizado.');
        }

        return response()->json([
            'data' => new PedidoResource(
                $pedido->load(['detalles.producto.imagenes', 'pago'])
            ),
        ]);
    }

    public function checkout(Request $request): JsonResponse
    {
        $data = $request->validate([
            'direccion_envio' => ['required', 'string', 'max:500'],
            'telefono' => ['required', 'string', 'max:30'],
            'notas' => ['nullable', 'string', 'max:1000'],
        ]);

        $carrito = CarritoCompra::where('cliente_id', $request->user()->id)
            ->where('estado', 'activo')
            ->with('detalles')
            ->first();

        if (! $carrito || $carrito->detalles->isEmpty()) {
            return response()->json([
                'message' => 'Tu carrito no tiene items.',
            ], 422);
        }

        $resultado = DB::transaction(function () use ($carrito, $data) {
            $total = 0;

            foreach ($carrito->detalles as $detalle) {
                $producto = Producto::lockForUpdate()->find($detalle->producto_id);
                $variante = ProductoTalla::lockForUpdate()->find($detalle->producto_talla_id);

                if (! $producto || ! $variante || ! $variante->activo || $variante->stock_disponible < $detalle->cantidad) {
                    $talla = $variante?->talla ? " (talla {$variante->talla})" : '';

                    return response()->json([
                        'message' => "Stock insuficiente para {$producto?->nombre}{$talla}. Revisa tu carrito.",
                    ], 422);
                }
            }

            $pedido = Pedido::create([
                'cliente_id' => $carrito->cliente_id,
                'fecha_pedido' => now(),
                'total' => 0,
                'estado_pedido' => 'pendiente',
                'direccion_envio' => $data['direccion_envio'],
                'telefono' => $data['telefono'],
                'notas' => $data['notas'] ?? null,
            ]);

            foreach ($carrito->detalles as $detalle) {
                $producto = Producto::find($detalle->producto_id);
                $variante = ProductoTalla::find($detalle->producto_talla_id);

                $variante->decrement('stock_disponible', $detalle->cantidad);
                $producto->sincronizarStockTotal();

                $subtotal = $producto->precio_venta * $detalle->cantidad;
                $total += $subtotal;

                DetallePedido::create([
                    'pedido_id' => $pedido->id,
                    'producto_id' => $producto->id,
                    'producto_talla_id' => $variante->id,
                    'talla' => $variante->talla,
                    'cantidad' => $detalle->cantidad,
                    'precio_unitario' => $producto->precio_venta,
                    'subtotal' => $subtotal,
                ]);
            }

            $pedido->update(['total' => $total]);
            $carrito->update([
                'estado' => 'procesado',
                'total' => $total,
            ]);

            return $pedido;
        });

        if ($resultado instanceof JsonResponse) {
            return $resultado;
        }

        return response()->json([
            'message' => 'Pedido creado. Procede con el pago.',
            'data' => new PedidoResource(
                $resultado->load(['detalles.producto.imagenes', 'pago'])
            ),
        ], 201);
    }
}
