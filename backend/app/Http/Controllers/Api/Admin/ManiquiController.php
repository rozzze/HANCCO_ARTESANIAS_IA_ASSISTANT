<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ManiquiResource;
use App\Models\Maniqui;
use App\Services\CloudflareR2Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ManiquiController extends Controller
{
    public function __construct(
        protected CloudflareR2Service $r2,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Maniqui::with('categoria');

        if ($request->filled('categoria_id')) {
            $query->where('categoria_id', $request->integer('categoria_id'));
        }

        if ($request->filled('activo')) {
            $query->where('activo', $request->boolean('activo'));
        }

        $maniquies = $query->orderBy('nombre')->get();

        return response()->json([
            'data' => ManiquiResource::collection($maniquies),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'categoria_id' => ['nullable', 'integer', 'exists:categorias,id'],
            'descripcion' => ['nullable', 'string'],
            'activo' => ['boolean'],
            'imagen' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
        ]);

        $subida = $this->r2->subirManiqui($request->file('imagen'), $data['nombre']);

        $maniqui = Maniqui::create([
            'nombre' => $data['nombre'],
            'categoria_id' => $data['categoria_id'] ?? null,
            'descripcion' => $data['descripcion'] ?? null,
            'activo' => filter_var($data['activo'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'url_referencia' => $subida['url'],
        ]);

        return response()->json([
            'message' => 'Maniqui creado.',
            'data' => new ManiquiResource($maniqui->load('categoria')),
        ], 201);
    }

    public function show(Maniqui $maniqui): JsonResponse
    {
        return response()->json([
            'data' => new ManiquiResource($maniqui->load('categoria')),
        ]);
    }

    public function update(Request $request, Maniqui $maniqui): JsonResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'categoria_id' => ['nullable', 'integer', 'exists:categorias,id'],
            'descripcion' => ['nullable', 'string'],
            'activo' => ['boolean'],
            'imagen' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
        ]);

        $update = [
            'nombre' => $data['nombre'],
            'categoria_id' => $data['categoria_id'] ?? null,
            'descripcion' => $data['descripcion'] ?? null,
        ];

        if ($request->has('activo')) {
            $update['activo'] = filter_var($data['activo'], FILTER_VALIDATE_BOOLEAN);
        }

        if ($request->hasFile('imagen')) {
            $urlAnterior = $maniqui->url_referencia;
            $subida = $this->r2->subirManiqui($request->file('imagen'), $data['nombre']);
            $update['url_referencia'] = $subida['url'];

            if (! empty($urlAnterior)) {
                $this->r2->eliminar($urlAnterior);
            }
        }

        $maniqui->update($update);
        $maniqui->load('categoria');

        return response()->json([
            'message' => 'Maniqui actualizado.',
            'data' => new ManiquiResource($maniqui),
        ]);
    }

    public function destroy(Maniqui $maniqui): JsonResponse
    {
        if (! empty($maniqui->url_referencia)) {
            $this->r2->eliminar($maniqui->url_referencia);
        }

        $maniqui->delete();

        return response()->json([
            'message' => 'Maniqui eliminado.',
        ]);
    }
}
