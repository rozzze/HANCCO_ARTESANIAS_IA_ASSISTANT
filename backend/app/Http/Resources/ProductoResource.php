<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'categoria_id' => $this->categoria_id,
            'categoria' => $this->whenLoaded('categoria', fn () => new CategoriaResource($this->categoria)),
            'nombre' => $this->nombre,
            'slug' => $this->slug,
            'material' => $this->material,
            'color' => $this->color,
            'precio_venta' => (float) $this->precio_venta,
            'stock_disponible' => $this->stock_disponible,
            'descripcion_ia' => $this->descripcion_ia,
            'descripcion_manual' => $this->descripcion_manual,
            'activo' => $this->activo,
            'tallas' => ProductoTallaResource::collection(
                $this->whenLoaded('tallas', fn () => $this->tallas->where('activo', true)->values())
            ),
            'imagenes' => ImagenResource::collection($this->whenLoaded('imagenes')),
            'imagen_principal_url' => $this->whenLoaded('imagenes', function () {
                $principal = $this->imagenes->firstWhere('es_principal', true) ?? $this->imagenes->first();
                return $principal?->url_cloudflare_s3;
            }),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}