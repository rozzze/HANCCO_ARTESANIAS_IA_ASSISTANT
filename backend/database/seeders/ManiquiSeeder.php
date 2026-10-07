<?php

namespace Database\Seeders;

use App\Models\Maniqui;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ManiquiSeeder extends Seeder
{
    public function run(): void
    {
        $maniquies = [
            ['nombre' => 'Mujer Adulta', 'descripcion' => 'Maniqui de mujer adulta para chompas y chalinas.'],
            ['nombre' => 'Hombre Adulto', 'descripcion' => 'Maniqui de hombre adulto para chompas y ponchos.'],
            ['nombre' => 'Nino', 'descripcion' => 'Maniqui infantil para productos pequenos.'],
            ['nombre' => 'Nina', 'descripcion' => 'Maniqui infantil nina para productos pequenos.'],
        ];

        foreach ($maniquies as $data) {
            Maniqui::updateOrCreate(
                ['slug' => Str::slug($data['nombre'])],
                array_merge($data, [
                    'slug' => Str::slug($data['nombre']),
                    'url_referencia' => '',
                    'activo' => true,
                ])
            );
        }
    }
}
