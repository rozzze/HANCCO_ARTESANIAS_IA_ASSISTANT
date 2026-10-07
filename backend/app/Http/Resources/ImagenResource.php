<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ImagenResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'producto_id' => $this->producto_id,
            'url_cloudflare_s3' => $this->url_cloudflare_s3,
            'generada_ia' => $this->generada_ia,
            'metadata_ia' => $this->metadata_ia,
            'es_principal' => $this->es_principal,
            'orden' => $this->orden,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}