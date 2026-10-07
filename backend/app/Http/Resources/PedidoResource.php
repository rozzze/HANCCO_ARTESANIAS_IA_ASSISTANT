<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PedidoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'cliente_id' => $this->cliente_id,
            'cliente' => $this->whenLoaded('cliente', fn () => new UsuarioResource($this->cliente)),
            'fecha_pedido' => $this->fecha_pedido?->toISOString(),
            'total' => (float) $this->total,
            'estado_pedido' => $this->estado_pedido,
            'direccion_envio' => $this->direccion_envio,
            'notas' => $this->notas,
            'detalles' => DetallePedidoResource::collection($this->whenLoaded('detalles')),
            'pago' => $this->whenLoaded('pago', fn () => new PagoResource($this->pago)),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}