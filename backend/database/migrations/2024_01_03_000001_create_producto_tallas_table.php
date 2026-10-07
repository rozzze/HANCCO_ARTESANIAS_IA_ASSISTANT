<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('producto_tallas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('productos')->cascadeOnDelete();
            $table->string('talla', 30);
            $table->integer('stock_disponible')->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->unique(['producto_id', 'talla']);
        });

        DB::table('productos')->orderBy('id')->chunk(200, function ($productos) {
            foreach ($productos as $producto) {
                DB::table('producto_tallas')->insert([
                    'producto_id' => $producto->id,
                    'talla' => $producto->talla !== null && $producto->talla !== '' ? $producto->talla : 'Unica',
                    'stock_disponible' => $producto->stock_disponible,
                    'activo' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('producto_tallas');
    }
};
