<?php

namespace Database\Seeders;

use App\Models\Categoria;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategoriaSeeder extends Seeder
{
    public function run(): void
    {
        $categorias = [
            ['nombre' => 'Chompas', 'descripcion' => 'Chompas de fibra de alpaca tejidas a mano.'],
            ['nombre' => 'Ponchos', 'descripcion' => 'Ponchos tradicionales andinos en alpaca.'],
            ['nombre' => 'Chalinas', 'descripcion' => 'Chalinas y bufandas suaves de alpaca.'],
            ['nombre' => 'Guantes', 'descripcion' => 'Guantes tejidos en fibra de alpaca.'],
            ['nombre' => 'Gorros', 'descripcion' => 'Gorros y chullos andinos.'],
            ['nombre' => 'Mantas', 'descripcion' => 'Mantas y frazadas de alpaca para el hogar.'],
        ];

        foreach ($categorias as $data) {
            Categoria::updateOrCreate(
                ['slug' => Str::slug($data['nombre'])],
                array_merge($data, ['slug' => Str::slug($data['nombre']), 'activo' => true])
            );
        }
    }
}