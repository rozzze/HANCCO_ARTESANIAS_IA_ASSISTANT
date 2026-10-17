<?php

use App\Http\Controllers\Api\Admin\CategoriaController as AdminCategoriaController;
use App\Http\Controllers\Api\Admin\ImagenController as AdminImagenController;
use App\Http\Controllers\Api\Admin\ManiquiController as AdminManiquiController;
use App\Http\Controllers\Api\Admin\PedidoController as AdminPedidoController;
use App\Http\Controllers\Api\Admin\ProductoController as AdminProductoController;
use App\Http\Controllers\Api\Admin\StatsController as AdminStatsController;
use App\Http\Controllers\Api\Admin\UsuarioController as AdminUsuarioController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CarritoController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\ManiquiController;
use App\Http\Controllers\Api\PagoController;
use App\Http\Controllers\Api\PedidoController;
use App\Http\Controllers\Api\ProductoController;
use App\Http\Controllers\Api\CheckoutController;
use Illuminate\Support\Facades\Route;

// === PUBLIC AUTH ===
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

// === PUBLIC CATALOG ===
Route::get('categorias', [CategoriaController::class, 'index']);
Route::get('categorias/{categoria}', [CategoriaController::class, 'show']);
Route::get('productos', [ProductoController::class, 'index']);
Route::get('productos/{producto}', [ProductoController::class, 'show']);
Route::get('maniquies', [ManiquiController::class, 'index']);

// === AUTHENTICATED CLIENT ===
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('carrito')->group(function () {
        Route::get('/', [CarritoController::class, 'show']);
        Route::post('items', [CarritoController::class, 'agregar']);
        Route::patch('items/{detalle}', [CarritoController::class, 'actualizar']);
        Route::delete('items/{detalle}', [CarritoController::class, 'eliminar']);
        Route::delete('/', [CarritoController::class, 'vaciar']);
    });

    Route::get('pedidos', [PedidoController::class, 'index']);
    Route::get('pedidos/{pedido}', [PedidoController::class, 'show']);
    Route::post('pedidos/checkout', [PedidoController::class, 'checkout']);

    Route::post('pedidos/{pedido}/pago', [PagoController::class, 'store']);
});

// === WEBHOOKS (sin auth, validan firma propia) ===
Route::post('webhooks/culqi', [PagoController::class, 'webhookCulqi']);

// === CHECKOUT (config publica para Culqi) ===
Route::get('checkout/config', [CheckoutController::class, 'config']);

// === ADMIN ===
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('stats', [AdminStatsController::class, 'index']);

    Route::apiResource('categorias', AdminCategoriaController::class);
    Route::apiResource('maniquies', AdminManiquiController::class)->parameters(['maniquies' => 'maniqui']);

    Route::apiResource('productos', AdminProductoController::class);
    Route::patch('productos/{producto}/stock', [AdminProductoController::class, 'actualizarStock']);
    Route::post('productos/{producto}/generar-descripcion', [AdminProductoController::class, 'generarDescripcion']);

    Route::get('productos/{producto}/imagenes', [AdminImagenController::class, 'index']);
    Route::post('productos/{producto}/imagenes', [AdminImagenController::class, 'store']);
    Route::get('imagenes/{imagen}', [AdminImagenController::class, 'show']);
    Route::patch('imagenes/{imagen}', [AdminImagenController::class, 'update']);
    Route::delete('imagenes/{imagen}', [AdminImagenController::class, 'destroy']);
    Route::post('imagenes/{imagen}/mejorar-ia', [AdminImagenController::class, 'mejorarConIa']);

    Route::apiResource('pedidos', AdminPedidoController::class)->only(['index', 'show', 'update']);
    Route::apiResource('usuarios', AdminUsuarioController::class)->only(['index', 'show', 'update', 'destroy']);
});