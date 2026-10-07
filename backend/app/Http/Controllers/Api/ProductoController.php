<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductoResource;
use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Producto::with(['categoria', 'imagenes', 'tallas']);

        if ($request->boolean('solo_activos', true)) {
            $query->where('activo', true);
        }

        if ($request->filled('categoria_id')) {
            $query->where('categoria_id', $request->integer('categoria_id'));
        }

        if ($request->filled('categoria_slug')) {
            $query->whereHas('categoria', fn ($q) => $q->where('slug', $request->string('categoria_slug')));
        }

        if ($request->filled('material')) {
            $query->where('material', $request->string('material'));
        }

        if ($request->filled('color')) {
            $query->where('color', $request->string('color'));
        }

        if ($request->filled('talla')) {
            $query->whereHas('tallas', function ($q) use ($request) {
                $q->where('activo', true)
                    ->where('talla', $request->string('talla'))
                    ->where('stock_disponible', '>', 0);
            });
        }

        if ($request->filled('buscar')) {
            $buscar = '%'.$request->string('buscar').'%';
            $query->where(function ($q) use ($buscar) {
                $q->where('nombre', 'like', $buscar)
                    ->orWhere('descripcion_ia', 'like', $buscar)
                    ->orWhere('descripcion_manual', 'like', $buscar);
            });
        }

        if ($request->filled('precio_min')) {
            $query->where('precio_venta', '>=', $request->float('precio_min'));
        }

        if ($request->filled('precio_max')) {
            $query->where('precio_venta', '<=', $request->float('precio_max'));
        }

        $ordenar = $request->string('ordenar', 'recientes')->toString();
        match ($ordenar) {
            'precio_asc' => $query->orderBy('precio_venta', 'asc'),
            'precio_desc' => $query->orderBy('precio_venta', 'desc'),
            'nombre' => $query->orderBy('nombre', 'asc'),
            default => $query->latest(),
        };

        $perPage = min($request->integer('per_page', 24), 100);

        $productos = $query->paginate($perPage);

        return response()->json([
            'data' => ProductoResource::collection($productos),
            'meta' => [
                'current_page' => $productos->currentPage(),
                'last_page' => $productos->lastPage(),
                'per_page' => $productos->perPage(),
                'total' => $productos->total(),
            ],
        ]);
    }

    public function show(Producto $producto): JsonResponse
    {
        return response()->json([
            'data' => new ProductoResource(
                $producto->load(['categoria', 'imagenes', 'tallas'])
            ),
        ]);
    }
}