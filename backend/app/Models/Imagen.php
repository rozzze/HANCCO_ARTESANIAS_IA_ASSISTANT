<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Imagen extends Model
{
    use HasFactory;

    protected $table = 'imagenes';

    protected $fillable = [
        'producto_id',
        'url_cloudflare_s3',
        'generada_ia',
        'metadata_ia',
        'es_principal',
        'orden',
    ];

    protected $casts = [
        'generada_ia' => 'boolean',
        'es_principal' => 'boolean',
        'metadata_ia' => 'array',
        'orden' => 'integer',
    ];

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }
}