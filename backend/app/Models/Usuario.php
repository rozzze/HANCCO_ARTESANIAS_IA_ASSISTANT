<?php

namespace App\Models;

use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use CanResetPassword, HasApiTokens, HasFactory, Notifiable;

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

    public function getEmailForPasswordReset(): string
    {
        return $this->correo;
    }

    public function sendPasswordResetNotification($token): void
    {
        $frontend = rtrim((string) config('services.frontend.url', 'http://localhost:4200'), '/');
        $url = $frontend.'/auth/recuperar/'.$token.'?correo='.urlencode($this->correo);

        $nombre = $this->nombres;
        $cuerpo = implode("\n\n", [
            "Hola {$nombre},",
            'Recibimos una solicitud para restablecer tu contrasena en Hancco Artesanias.',
            "Entra a este enlace para crear una nueva (expira en 60 minutos):",
            $url,
            'Si no solicitaste esto, ignora este correo: tu contrasena no cambiara.',
            '- Hancco Artesanias',
        ]);

        Mail::raw($cuerpo, function ($message) {
            $message->to($this->correo)
                ->subject('Recupera tu contrasena - Hancco Artesanias');
        });
    }
}