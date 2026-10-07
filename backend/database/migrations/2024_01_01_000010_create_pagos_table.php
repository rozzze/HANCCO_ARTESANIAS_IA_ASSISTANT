<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pagos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pedido_id')->unique()->constrained('pedidos')->cascadeOnDelete();
            $table->string('metodo_pago');
            $table->string('transaccion_id')->nullable();
            $table->decimal('monto', 10, 2);
            $table->dateTime('fecha_pago')->nullable();
            $table->enum('estado_pago', ['pendiente', 'completado', 'fallido', 'reembolsado'])->default('pendiente');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('metodo_pago');
            $table->index('estado_pago');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos');
    }
};