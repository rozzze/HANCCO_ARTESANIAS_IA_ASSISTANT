<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $table->string('comprobante_url', 500)->nullable()->after('metadata');
        });

        Schema::table('pedidos', function (Blueprint $table) {
            $table->string('telefono', 30)->nullable()->after('direccion_envio');
        });
    }

    public function down(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $table->dropColumn('comprobante_url');
        });

        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropColumn('telefono');
        });
    }
};
