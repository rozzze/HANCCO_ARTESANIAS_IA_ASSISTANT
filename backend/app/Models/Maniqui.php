<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Maniqui extends Model
{
    use HasFactory;

    protected $table = 'maniquies';

    protected $fillable = [
        'nombre',
        'slug',
        'categoria_id',
        'url_referencia',
        'descripcion',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'categoria_id' => 'integer',
    ];

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    protected static function booted(): void
    {
        static::creating(function (Maniqui $maniqui) {
            if (empty($maniqui->slug)) {
                $maniqui->slug = Str::slug($maniqui->nombre);
            }
        });
    }
}
