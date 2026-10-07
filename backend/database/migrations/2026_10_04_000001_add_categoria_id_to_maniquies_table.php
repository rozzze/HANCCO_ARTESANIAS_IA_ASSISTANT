<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('maniquies', function (Blueprint $table) {
            $table->foreignId('categoria_id')
                ->nullable()
                ->after('slug')
                ->constrained('categorias')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('maniquies', function (Blueprint $table) {
            $table->dropConstrainedForeignId('categoria_id');
        });
    }
};
