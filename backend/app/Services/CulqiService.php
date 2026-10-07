<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CulqiService
{
    protected string $publicKey;
    protected string $secretKey;
    protected string $apiUrl;
    protected string $env;

    public function __construct()
    {
        $this->publicKey = config('services.culqi.public_key') ?? '';
        $this->secretKey = config('services.culqi.secret_key') ?? '';
        $this->env = config('services.culqi.env', 'sandbox');
        $this->apiUrl = 'https://api.culqi.com/v2';
    }

    public function estaConfigurado(): bool
    {
        return !empty($this->publicKey) && !empty($this->secretKey);
    }

    public function crearCargo(
        string $tokenId,
        float $monto,
        int $pedidoId,
        string $descripcion,
        string $correoCliente = ''
    ): array {
        if (!$this->estaConfigurado()) {
            throw new \RuntimeException('Culqi no configurado. Agrega CULQI_PUBLIC_KEY y CULQI_SECRET_KEY en .env');
        }

        $payload = [
            'amount' => (int) round($monto * 100),
            'currency_code' => 'PEN',
            'email' => $correoCliente,
            'source_id' => $tokenId,
            'description' => $descripcion,
            'metadata' => [
                'pedido_id' => $pedidoId,
                'orden_interna' => 'HANCCO-'.$pedidoId,
            ],
        ];

        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->secretKey,
            'Content-Type' => 'application/json',
        ])->post($this->apiUrl.'/charges', $payload);

        Log::info('Culqi crearCargo', [
            'pedido_id' => $pedidoId,
            'monto' => $monto,
            'status' => $response->status(),
        ]);

        if ($response->failed()) {
            $body = $response->json();
            $mensaje = $body['user_message'] ?? $body['merchant_message'] ?? $response->body();
            throw new \RuntimeException('Culqi rechazo el cargo: '.$mensaje);
        }

        return $response->json();
    }

    public function obtenerCargo(string $chargeId): array
    {
        if (!$this->estaConfigurado()) {
            throw new \RuntimeException('Culqi no configurado.');
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->secretKey,
        ])->get($this->apiUrl.'/charges/'.$chargeId);

        if ($response->failed()) {
            throw new \RuntimeException('No se pudo obtener cargo: '.$response->body());
        }

        return $response->json();
    }

    public function validarFirmaWebhook(string $payload, ?string $firma): bool
    {
        if (empty($firma)) {
            return false;
        }

        $firmaEsperada = hash_hmac('sha256', $payload, $this->secretKey);
        return hash_equals($firmaEsperada, $firma);
    }

    public function getPublicKey(): string
    {
        return $this->publicKey;
    }

    public function getEnv(): string
    {
        return $this->env;
    }
}