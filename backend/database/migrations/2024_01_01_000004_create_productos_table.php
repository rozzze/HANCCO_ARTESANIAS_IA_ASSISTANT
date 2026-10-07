<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('productos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('categoria_id')->constrained('categorias')->cascadeOnDelete();
            $table->string('nombre');
            $table->string('slug')->unique();
            $table->string('material');
            $table->string('talla');
            $table->string('color');
            $table->decimal('precio_venta', 10, 2);
            $table->integer('stock_disponible')->default(0);
            $table->text('descripcion_ia')->nullable();
            $table->text('descripcion_manual')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index(['categoria_id', 'activo']);
            $table->index('material');
            $table->index('color');
            $table->index('talla');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('productos');
    }
};