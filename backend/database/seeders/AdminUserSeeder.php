<?php

namespace Database\Seeders;

use App\Models\Usuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $usuarios = [
            [
                'nombres' => 'Administrador Hancco',
                'correo' => 'admin@hancco.com',
                'contrasena' => Hash::make('admin1234'),
                'rol' => 'admin',
            ],
            [
                'nombres' => 'Cliente Demo',
                'correo' => 'cliente@hancco.com',
                'contrasena' => Hash::make('cliente1234'),
                'rol' => 'cliente',
            ],
        ];

        foreach ($usuarios as $data) {
            Usuario::updateOrCreate(
                ['correo' => $data['correo']],
                $data
            );
        }
    }
}