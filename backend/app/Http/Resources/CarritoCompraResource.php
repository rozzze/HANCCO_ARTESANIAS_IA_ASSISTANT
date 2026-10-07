<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CarritoCompraResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'cliente_id' => $this->cliente_id,
            'total' => (float) $this->total,
            'estado' => $this->estado,
            'detalles' => DetalleCarritoResource::collection($this->whenLoaded('detalles')),
            'items_count' => $this->whenLoaded('detalles', fn () => $this->detalles->sum('cantidad')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}