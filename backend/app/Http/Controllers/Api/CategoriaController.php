<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoriaResource;
use App\Models\Categoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoriaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Categoria::query()->withCount('productos');

        if ($request->boolean('solo_activos', true)) {
            $query->where('activo', true);
        }

        $categorias = $query->orderBy('nombre')->get();

        return response()->json([
            'data' => CategoriaResource::collection($categorias),
        ]);
    }

    public function show(Categoria $categoria): JsonResponse
    {
        return response()->json([
            'data' => new CategoriaResource($categoria->loadCount('productos')),
        ]);
    }
}