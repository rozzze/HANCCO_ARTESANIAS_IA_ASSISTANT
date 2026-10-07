<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductoTalla extends Model
{
    use HasFactory;

    protected $table = 'producto_tallas';

    public const TALLAS_DISPONIBLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Unica'];

    public const ORDEN_TALLAS = "FIELD(talla, 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Unica')";

    protected $fillable = [
        'producto_id',
        'talla',
        'stock_disponible',
        'activo',
    ];

    protected $casts = [
        'stock_disponible' => 'integer',
        'activo' => 'boolean',
    ];

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }

    public function tieneStock(int $cantidad = 1): bool
    {
        return $this->activo && $this->stock_disponible >= $cantidad;
    }

    public function descontarStock(int $cantidad): bool
    {
        if (!$this->tieneStock($cantidad)) {
            return false;
        }
        $this->decrement('stock_disponible', $cantidad);
        return true;
    }

    public function sincronizarProducto(): void
    {
        $this->producto?->sincronizarStockTotal();
    }
}
