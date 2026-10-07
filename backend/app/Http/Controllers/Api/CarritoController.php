<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CarritoCompraResource;
use App\Models\CarritoCompra;
use App\Models\DetalleCarrito;
use App\Models\Producto;
use App\Models\ProductoTalla;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CarritoController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $carrito = $this->obtenerOCrearCarrito($request->user());

        return response()->json([
            'data' => new CarritoCompraResource($this->cargarCarrito($carrito)),
        ]);
    }

    public function agregar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'producto_id' => ['required', 'integer', 'exists:productos,id'],
            'producto_talla_id' => ['required', 'integer', 'exists:producto_tallas,id'],
            'cantidad' => ['required', 'integer', 'min:1'],
        ]);

        $carrito = $this->obtenerOCrearCarrito($request->user());

        return DB::transaction(function () use ($carrito, $data) {
            $producto = Producto::lockForUpdate()->findOrFail($data['producto_id']);

            $variante = ProductoTalla::lockForUpdate()
                ->where('id', $data['producto_talla_id'])
                ->where('producto_id', $producto->id)
                ->first();

            if (!$variante || !$variante->activo) {
                return response()->json([
                    'message' => 'La talla seleccionada no esta disponible.',
                ], 422);
            }

            $detalle = DetalleCarrito::where('carrito_id', $carrito->id)
                ->where('producto_id', $producto->id)
                ->where('producto_talla_id', $variante->id)
                ->first();

            $cantidadSolicitada = $data['cantidad'];
            $cantidadTotal = ($detalle?->cantidad ?? 0) + $cantidadSolicitada;

            if ($cantidadTotal > $variante->stock_disponible) {
                return response()->json([
                    'message' => "Stock insuficiente para la talla {$variante->talla}.",
                ], 422);
            }

            if ($detalle) {
                $detalle->update([
                    'cantidad' => $cantidadTotal,
                    'subtotal' => $producto->precio_venta * $cantidadTotal,
                ]);
            } else {
                DetalleCarrito::create([
                    'carrito_id' => $carrito->id,
                    'producto_id' => $producto->id,
                    'producto_talla_id' => $variante->id,
                    'cantidad' => $cantidadSolicitada,
                    'subtotal' => $producto->precio_venta * $cantidadSolicitada,
                ]);
            }

            $carrito->recalcularTotal();

            return response()->json([
                'message' => 'Producto agregado al carrito.',
                'data' => new CarritoCompraResource($this->cargarCarrito($carrito)),
            ]);
        });
    }

    public function actualizar(Request $request, DetalleCarrito $detalle): JsonResponse
    {
        $this->asegurarCarritoDelUsuario($request->user(), $detalle);

        $data = $request->validate([
            'cantidad' => ['required', 'integer', 'min:1'],
        ]);

        return DB::transaction(function () use ($detalle, $data) {
            $producto = Producto::lockForUpdate()->findOrFail($detalle->producto_id);

            $variante = ProductoTalla::lockForUpdate()->find($detalle->producto_talla_id);

            if (!$variante || !$variante->activo) {
                return response()->json([
                    'message' => 'La talla de este item ya no esta disponible. Eliminalo del carrito.',
                ], 422);
            }

            if ($data['cantidad'] > $variante->stock_disponible) {
                return response()->json([
                    'message' => "Stock insuficiente para la talla {$variante->talla}.",
                ], 422);
            }

            $detalle->update([
                'cantidad' => $data['cantidad'],
                'subtotal' => $producto->precio_venta * $data['cantidad'],
            ]);

            $carrito = $detalle->carrito;
            $carrito->recalcularTotal();

            return response()->json([
                'message' => 'Cantidad actualizada.',
                'data' => new CarritoCompraResource($this->cargarCarrito($carrito)),
            ]);
        });
    }

    public function eliminar(Request $request, DetalleCarrito $detalle): JsonResponse
    {
        $this->asegurarCarritoDelUsuario($request->user(), $detalle);

        $carrito = $detalle->carrito;
        $detalle->delete();
        $carrito->recalcularTotal();

        return response()->json([
            'message' => 'Producto eliminado del carrito.',
            'data' => new CarritoCompraResource($this->cargarCarrito($carrito)),
        ]);
    }

    public function vaciar(Request $request): JsonResponse
    {
        $carrito = $this->obtenerOCrearCarrito($request->user());
        $carrito->detalles()->delete();
        $carrito->update(['total' => 0]);

        return response()->json([
            'message' => 'Carrito vaciado.',
            'data' => new CarritoCompraResource($carrito->load('detalles')),
        ]);
    }

    protected function cargarCarrito(CarritoCompra $carrito): CarritoCompra
    {
        return $carrito->load(['detalles.productoTalla', 'detalles.producto.imagenes']);
    }

    protected function obtenerOCrearCarrito(Usuario $usuario): CarritoCompra
    {
        return CarritoCompra::firstOrCreate(
            ['cliente_id' => $usuario->id, 'estado' => 'activo'],
            ['total' => 0]
        );
    }

    protected function asegurarCarritoDelUsuario(Usuario $usuario, DetalleCarrito $detalle): void
    {
        if ($detalle->carrito->cliente_id !== $usuario->id) {
            abort(403, 'No autorizado.');
        }
    }
}
