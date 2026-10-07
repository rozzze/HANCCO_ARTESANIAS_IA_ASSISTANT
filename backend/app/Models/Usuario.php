<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'usuarios';

    protected $fillable = [
        'nombres',
        'correo',
        'contrasena',
        'rol',
        'telefono',
        'direccion',
    ];

    protected $hidden = [
        'contrasena',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'contrasena' => 'hashed',
        ];
    }

    public function carritos(): HasMany
    {
        return $this->hasMany(CarritoCompra::class, 'cliente_id');
    }

    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class, 'cliente_id');
    }

    public function carritoActivo(): ?CarritoCompra
    {
        return $this->carritos()->where('estado', 'activo')->latest()->first();
    }

    public function esAdmin(): bool
    {
        return $this->rol === 'admin';
    }

    public function getAuthPassword(): string
    {
        return $this->contrasena;
    }
}