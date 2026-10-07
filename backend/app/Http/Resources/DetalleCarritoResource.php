<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DetalleCarritoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'carrito_id' => $this->carrito_id,
            'producto_id' => $this->producto_id,
            'producto' => $this->whenLoaded('producto', fn () => new ProductoResource($this->producto)),
            'producto_talla_id' => $this->producto_talla_id,
            'talla' => $this->productoTalla?->talla,
            'stock_talla' => $this->productoTalla?->stock_disponible,
            'cantidad' => $this->cantidad,
            'subtotal' => (float) $this->subtotal,
        ];
    }
}