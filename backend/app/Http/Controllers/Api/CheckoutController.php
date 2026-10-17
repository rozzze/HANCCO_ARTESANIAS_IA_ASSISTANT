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
                    ['id' => 'yape', 'nombre' => 'Yape', 'descripcion' => 'Yapea el total y sube tu comprobante. Verificamos al instante.', 'icono' => '📱'],
                    ['id' => 'contraentrega', 'nombre' => 'Contraentrega', 'descripcion' => 'Paga en efectivo al recibir tu pedido.', 'icono' => '🚚'],
                ],
                'yape' => [
                    'numero' => config('services.yape.numero', ''),
                    'qr_url' => config('services.yape.qr_url', ''),
                ],
                'whatsapp_tienda' => config('services.whatsapp.tienda', ''),
                'culqi_cuotas' => [
                    ['id' => 'sin_cuotas', 'nombre' => 'Sin cuotas', 'monto_mult' => 1],
                    ['id' => '3_cuotas', 'nombre' => '3 cuotas', 'monto_mult' => 1.05],
                    ['id' => '6_cuotas', 'nombre' => '6 cuotas', 'monto_mult' => 1.10],
                ],
            ],
        ]);
    }
}
