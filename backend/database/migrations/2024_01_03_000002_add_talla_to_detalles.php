<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('detalle_carrito', 'producto_talla_id')) {
            Schema::table('detalle_carrito', function (Blueprint $table) {
                $table->foreignId('producto_talla_id')->nullable()->after('producto_id')
                    ->constrained('producto_tallas')->restrictOnDelete();
            });
        }

        DB::statement('
            UPDATE detalle_carrito dc
            JOIN producto_tallas pt ON pt.producto_id = dc.producto_id
            SET dc.producto_talla_id = pt.id
            WHERE dc.producto_talla_id IS NULL
        ');

        if (!Schema::hasIndex('detalle_carrito', 'detalle_carrito_unico')) {
            Schema::table('detalle_carrito', function (Blueprint $table) {
                if (Schema::hasIndex('detalle_carrito', 'detalle_carrito_carrito_id_producto_id_unique')) {
                    $table->dropUnique('detalle_carrito_carrito_id_producto_id_unique');
                }
                $table->unique(['carrito_id', 'producto_id', 'producto_talla_id'], 'detalle_carrito_unico');
            });
        }

        if (!Schema::hasColumn('detalle_pedidos', 'producto_talla_id')) {
            Schema::table('detalle_pedidos', function (Blueprint $table) {
                $table->foreignId('producto_talla_id')->nullable()->after('producto_id')
                    ->constrained('producto_tallas')->restrictOnDelete();
                $table->string('talla', 30)->nullable()->after('producto_talla_id');
            });
        }

        DB::statement('
            UPDATE detalle_pedidos dp
            JOIN producto_tallas pt ON pt.producto_id = dp.producto_id
            SET dp.producto_talla_id = pt.id, dp.talla = pt.talla
            WHERE dp.producto_talla_id IS NULL
        ');

        if (Schema::hasColumn('productos', 'talla')) {
            Schema::table('productos', function (Blueprint $table) {
                if (Schema::hasIndex('productos', 'productos_talla_index')) {
                    $table->dropIndex('productos_talla_index');
                }
                $table->dropColumn('talla');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('productos', 'talla')) {
            Schema::table('productos', function (Blueprint $table) {
                $table->string('talla')->default('Unica')->after('material');
            });

            DB::statement('
                UPDATE productos p
                JOIN producto_tallas pt ON pt.producto_id = p.id
                SET p.talla = pt.talla
            ');

            Schema::table('productos', function (Blueprint $table) {
                $table->index('talla');
            });
        }

        if (Schema::hasColumn('detalle_pedidos', 'producto_talla_id')) {
            Schema::table('detalle_pedidos', function (Blueprint $table) {
                $table->dropConstrainedForeignId('producto_talla_id');
                $table->dropColumn('talla');
            });
        }

        if (Schema::hasColumn('detalle_carrito', 'producto_talla_id')) {
            Schema::table('detalle_carrito', function (Blueprint $table) {
                if (Schema::hasIndex('detalle_carrito', 'detalle_carrito_unico')) {
                    $table->dropUnique('detalle_carrito_unico');
                }
                $table->dropConstrainedForeignId('producto_talla_id');
                $table->unique(['carrito_id', 'producto_id']);
            });
        }
    }
};
