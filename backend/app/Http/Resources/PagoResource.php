<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PagoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'pedido_id' => $this->pedido_id,
            'metodo_pago' => $this->metodo_pago,
            'transaccion_id' => $this->transaccion_id,
            'monto' => (float) $this->monto,
            'fecha_pago' => $this->fecha_pago?->toISOString(),
            'estado_pago' => $this->estado_pago,
            'metadata' => $this->metadata,
        ];
    }
}