<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('password_reset_tokens')) {
            $this->crearTabla();

            return;
        }

        // El setup original creo esta tabla con columna `correo`, pero el
        // PasswordBroker de Laravel lee/escribe la columna `email`.
        // La renombramos para que el broker funcione sin tocar datos.
        if (Schema::hasColumn('password_reset_tokens', 'correo')
            && ! Schema::hasColumn('password_reset_tokens', 'email')) {
            Schema::table('password_reset_tokens', function (Blueprint $table) {
                $table->renameColumn('correo', 'email');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('password_reset_tokens');
    }

    protected function crearTabla(): void
    {
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email', 191)->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
    }
};
