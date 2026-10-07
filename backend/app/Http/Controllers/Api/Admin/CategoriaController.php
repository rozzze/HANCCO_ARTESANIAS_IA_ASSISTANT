<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoriaResource;
use App\Models\Categoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoriaController extends Controller
{
    public function index(): JsonResponse
    {
        $categorias = Categoria::withCount('productos')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'data' => CategoriaResource::collection($categorias),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:120', 'unique:categorias,nombre'],
            'slug' => ['nullable', 'string', 'max:140', 'unique:categorias,slug'],
            'descripcion' => ['nullable', 'string'],
            'imagen_url' => ['nullable', 'string', 'max:500'],
            'activo' => ['boolean'],
        ]);

        $categoria = Categoria::create($data);

        return response()->json([
            'message' => 'Categoria creada.',
            'data' => new CategoriaResource($categoria),
        ], 201);
    }

    public function show(Categoria $categoria): JsonResponse
    {
        return response()->json([
            'data' => new CategoriaResource($categoria->loadCount('productos')),
        ]);
    }

    public function update(Request $request, Categoria $categoria): JsonResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:120', 'unique:categorias,nombre,'.$categoria->id],
            'slug' => ['nullable', 'string', 'max:140', 'unique:categorias,slug,'.$categoria->id],
            'descripcion' => ['nullable', 'string'],
            'imagen_url' => ['nullable', 'string', 'max:500'],
            'activo' => ['boolean'],
        ]);

        $categoria->update($data);

        return response()->json([
            'message' => 'Categoria actualizada.',
            'data' => new CategoriaResource($categoria),
        ]);
    }

    public function destroy(Categoria $categoria): JsonResponse
    {
        if ($categoria->productos()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar: la categoria tiene productos asociados.',
            ], 422);
        }

        $categoria->delete();

        return response()->json([
            'message' => 'Categoria eliminada.',
        ]);
    }
}