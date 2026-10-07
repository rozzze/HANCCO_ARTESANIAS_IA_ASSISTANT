<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CulqiService;
use Illuminate\Http\JsonResponse;

class CheckoutController extends Controller
{
    public function __construct(
        protected CulqiService $culqi,
    ) {}

    public function config(): JsonResponse
    {
        return response()->json([
            'data' => [
                'culqi' => [
                    'public_key' => $this->culqi->getPublicKey(),
                    'env' => $this->culqi->getEnv(),
                    'activo' => $this->culqi->estaConfigurado(),
                ],
                'metodos_pago' => [
                    ['id' => 'contraentrega', 'nombre' => 'Contraentrega', 'descripcion' => 'Paga al recibir tu pedido en casa.', 'icono' => '🚚'],
                    ['id' => 'yape', 'nombre' => 'Yape', 'descripcion' => 'Paga con tu app Yape.', 'icono' => '📱'],
                    ['id' => 'tarjeta', 'nombre' => 'Tarjeta de credito/debito', 'descripcion' => 'Visa, Mastercard, Amex via Culqi.', 'icono' => '💳'],
                    ['id' => 'transferencia', 'nombre' => 'Transferencia bancaria', 'descripcion' => 'BCP, BBVA, Interbank.', 'icono' => '🏦'],
                ],
                'culqi_cuotas' => [
                    ['id' => 'sin_cuotas', 'nombre' => 'Sin cuotas', 'monto_mult' => 1],
                    ['id' => '3_cuotas', 'nombre' => '3 cuotas', 'monto_mult' => 1.05],
                    ['id' => '6_cuotas', 'nombre' => '6 cuotas', 'monto_mult' => 1.10],
                ],
            ],
        ]);
    }
}