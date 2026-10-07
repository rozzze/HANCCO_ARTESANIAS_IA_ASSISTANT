<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ImagenResource;
use App\Models\Imagen;
use App\Models\Producto;
use App\Services\CloudflareR2Service;
use App\Services\ImageEnhancementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ImagenController extends Controller
{
    public function __construct(
        protected CloudflareR2Service $r2,
        protected ImageEnhancementService $enhancer,
    ) {}

    public function index(Producto $producto): JsonResponse
    {
        $imagenes = $producto->imagenes()->orderBy('orden')->get();

        return response()->json([
            'data' => ImagenResource::collection($imagenes),
        ]);
    }

    public function store(Request $request, Producto $producto): JsonResponse
    {
        $data = $request->validate([
            'imagen' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
            'es_principal' => ['nullable'],
            'orden' => ['nullable', 'integer', 'min:0'],
        ]);

        $data['es_principal'] = filter_var($data['es_principal'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $archivo = $request->file('imagen');
        $subida = $this->r2->subir($archivo, $producto->slug, CloudflareR2Service::TIPO_FOTO_REAL);

        if ($data['es_principal'] ?? false) {
            $producto->imagenes()->update(['es_principal' => false]);
        }

        $imagen = $producto->imagenes()->create([
            'url_cloudflare_s3' => $subida['url'],
            'generada_ia' => false,
            'es_principal' => $data['es_principal'] ?? ($producto->imagenes()->count() === 0),
            'orden' => $data['orden'] ?? ($producto->imagenes()->count() + 1),
        ]);

        return response()->json([
            'message' => 'Imagen subida.',
            'data' => new ImagenResource($imagen),
        ], 201);
    }

    public function show(Imagen $imagen): JsonResponse
    {
        return response()->json([
            'data' => new ImagenResource($imagen->load('producto')),
        ]);
    }

    public function update(Request $request, Imagen $imagen): JsonResponse
    {
        $data = $request->validate([
            'es_principal' => ['nullable'],
            'orden' => ['nullable', 'integer', 'min:0'],
        ]);

        if (isset($data['es_principal'])) {
            $data['es_principal'] = filter_var($data['es_principal'], FILTER_VALIDATE_BOOLEAN);
        }

        if (($data['es_principal'] ?? false) === true) {
            Imagen::where('producto_id', $imagen->producto_id)
                ->where('id', '!=', $imagen->id)
                ->update(['es_principal' => false]);
        }

        $imagen->update(array_filter($data, fn ($v) => $v !== null));

        return response()->json([
            'message' => 'Imagen actualizada.',
            'data' => new ImagenResource($imagen->fresh()),
        ]);
    }

    public function destroy(Imagen $imagen): JsonResponse
    {
        $this->r2->eliminar($imagen->url_cloudflare_s3);
        $imagen->delete();

        return response()->json([
            'message' => 'Imagen eliminada.',
        ]);
    }

    public function mejorarConIa(Request $request, Imagen $imagen): JsonResponse
    {
        $data = $request->validate([
            'maniqui_id' => ['required', 'integer', 'exists:maniquies,id'],
        ]);

        try {
            $imagenMejorada = $this->enhancer->mejorarImagen(
                $imagen,
                (int) $data['maniqui_id'],
            );

            return response()->json([
                'message' => 'Imagen generada con IA.',
                'data' => new ImagenResource($imagenMejorada),
            ], 201);
        } catch (\RuntimeException $e) {
            Log::error('Fallo al generar imagen IA', [
                'imagen_id' => $imagen->id,
                'maniqui_id' => $request->integer('maniqui_id'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Error al generar con IA.',
                'detalle' => $e->getMessage(),
            ], 502);
        }
    }
}
