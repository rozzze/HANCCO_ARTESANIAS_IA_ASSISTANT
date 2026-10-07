<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('imagenes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('productos')->cascadeOnDelete();
            $table->string('url_cloudflare_s3');
            $table->boolean('generada_ia')->default(false);
            $table->json('metadata_ia')->nullable();
            $table->boolean('es_principal')->default(false);
            $table->integer('orden')->default(0);
            $table->timestamps();

            $table->index(['producto_id', 'es_principal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('imagenes');
    }
};