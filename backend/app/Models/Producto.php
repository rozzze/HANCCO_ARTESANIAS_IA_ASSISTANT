<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Producto extends Model
{
    use HasFactory;

    protected $table = 'productos';

    protected $fillable = [
        'categoria_id',
        'nombre',
        'slug',
        'material',
        'color',
        'precio_venta',
        'stock_disponible',
        'descripcion_ia',
        'descripcion_manual',
        'activo',
    ];

    protected $casts = [
        'precio_venta' => 'decimal:2',
        'stock_disponible' => 'integer',
        'activo' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (Producto $producto) {
            if (empty($producto->slug)) {
                $producto->slug = self::generarSlugUnico($producto->nombre);
            }
        });

        static::updating(function (Producto $producto) {
            if ($producto->isDirty('nombre')) {
                $producto->slug = self::generarSlugUnico($producto->nombre, $producto->id);
            }
        });
    }

    public static function generarSlugUnico(string $nombre, ?int $exceptoId = null): string
    {
        $base = Str::slug($nombre) ?: 'producto';
        $slug = $base;
        $contador = 1;

        $query = static::query()->where('slug', $slug);
        if ($exceptoId !== null) {
            $query->where('id', '!=', $exceptoId);
        }

        while ($query->exists()) {
            $slug = $base.'-'.$contador++;
            $query = static::query()->where('slug', $slug);
            if ($exceptoId !== null) {
                $query->where('id', '!=', $exceptoId);
            }
        }

        return $slug;
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    public function imagenes(): HasMany
    {
        return $this->hasMany(Imagen::class);
    }

    public function tallas(): HasMany
    {
        return $this->hasMany(ProductoTalla::class)
            ->orderByRaw(ProductoTalla::ORDEN_TALLAS);
    }

    public function tallasActivas(): HasMany
    {
        return $this->tallas()->where('activo', true);
    }

    public function sincronizarStockTotal(): void
    {
        $total = (int) $this->tallas()->where('activo', true)->sum('stock_disponible');
        $this->forceFill(['stock_disponible' => $total])->saveQuietly();
    }

    public function imagenPrincipal(): ?Imagen
    {
        return $this->imagenes()->where('es_principal', true)->first()
            ?? $this->imagenes()->orderBy('orden')->first();
    }

    public function tieneStock(int $cantidad = 1): bool
    {
        return $this->stock_disponible >= $cantidad;
    }

    public function descontarStock(int $cantidad): bool
    {
        if (!$this->tieneStock($cantidad)) {
            return false;
        }
        $this->decrement('stock_disponible', $cantidad);
        return true;
    }
}