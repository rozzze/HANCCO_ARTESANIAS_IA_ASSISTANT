<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductoTallaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'producto_id' => $this->producto_id,
            'talla' => $this->talla,
            'stock_disponible' => $this->stock_disponible,
            'activo' => $this->activo,
        ];
    }
}
