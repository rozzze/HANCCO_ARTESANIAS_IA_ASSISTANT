<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetalleCarrito extends Model
{
    use HasFactory;

    protected $table = 'detalle_carrito';

    protected $fillable = [
        'carrito_id',
        'producto_id',
        'producto_talla_id',
        'cantidad',
        'subtotal',
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'subtotal' => 'decimal:2',
    ];

    public function carrito(): BelongsTo
    {
        return $this->belongsTo(CarritoCompra::class, 'carrito_id');
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }

    public function productoTalla(): BelongsTo
    {
        return $this->belongsTo(ProductoTalla::class, 'producto_talla_id');
    }
}