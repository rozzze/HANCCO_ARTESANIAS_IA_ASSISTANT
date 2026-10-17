<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class GeminiService
{
    public function __construct(
        protected ?string $apiKey = null,
        protected ?string $model = null,
    ) {
        $this->apiKey = $apiKey ?? config('services.gemini.api_key');
        $this->model = $model ?? config('services.gemini.model', 'gemini-flash-latest');
    }

    public function generarDescripcion(string $nombreProducto, array $atributos = []): string
    {
        $this->asegurarApiKey();

        return $this->stub('descripcion', compact('nombreProducto', 'atributos'));
    }

    public function mejorarDescripcion(string $texto): string
    {
        $this->asegurarApiKey();

        return $this->stub('mejorar_descripcion', ['texto' => $texto]);
    }

    public function generarDescripcionDesdeImagen(
        string $imagenBase64,
        string $mime,
        string $nombreProducto,
        ?string $material = null,
        ?string $color = null,
    ): string {
        $this->asegurarApiKey();

        $timeout = (int) config('services.gemini.timeout', 120);
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/'.$this->model.':generateContent?key='.urlencode((string) $this->apiKey);

        $payload = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $this->promptDescripcion($nombreProducto, $material, $color)],
                        ['inline_data' => ['mime_type' => $mime, 'data' => $imagenBase64]],
                    ],
                ],
            ],
        ];

        $response = Http::timeout($timeout)->post($url, $payload);

        if ($response->failed()) {
            throw new RuntimeException(
                'Gemini no pudo generar la descripcion (HTTP '.$response->status().'): '.mb_substr($response->body(), 0, 300)
            );
        }

        $texto = collect($response->json('candidates.0.content.parts', []))
            ->map(fn (array $part) => $part['text'] ?? '')
            ->implode('');

        if (trim($texto) === '') {
            throw new RuntimeException('Gemini no devolvio texto de descripcion.');
        }

        return trim($texto);
    }

    protected function promptDescripcion(string $nombre, ?string $material, ?string $color): string
    {
        $detalles = collect(array_filter([
            $material !== null && $material !== '' ? 'material: '.$material : null,
            $color !== null && $color !== '' ? 'color: '.$color : null,
        ]))->implode(', ');

        return implode(' ', [
            'Eres copywriter de una tienda de artesanias peruanas.',
            'Observa la imagen del producto "'.$nombre.'"'.($detalles !== '' ? ' ('.$detalles.')' : '').'.',
            'Redacta una descripcion comercial atractiva en espanol de 2 a 3 frases (entre 60 y 120 palabras).',
            'Destaca la calidad, la textura, la calidez, el color y el origen artesanal andino.',
            'No inventes precios, tallas ni datos que no sean visibles.',
            'Devuelve unicamente el texto de la descripcion, sin titulos ni comillas.',
        ]);
    }

    public function generarImagenManiqui(
        string $prendaBase64,
        string $prendaMime,
        string $maniquiBase64,
        string $maniquiMime,
    ): string {
        $this->asegurarApiKey();

        $model = config('services.gemini.model_image', 'gemini-2.5-flash-image');
        $timeout = (int) config('services.gemini.timeout', 120);
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/'.$model.':generateContent?key='.urlencode((string) $this->apiKey);

        $payload = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $this->promptComposicionManiqui()],
                        ['inline_data' => ['mime_type' => $prendaMime, 'data' => $prendaBase64]],
                        ['inline_data' => ['mime_type' => $maniquiMime, 'data' => $maniquiBase64]],
                    ],
                ],
            ],
            'generationConfig' => [
                'responseModalities' => ['Image', 'Text'],
            ],
        ];

        $response = Http::timeout($timeout)->post($url, $payload);

        if ($response->failed()) {
            throw new RuntimeException(
                'Gemini no pudo generar la imagen (HTTP '.$response->status().'): '.mb_substr($response->body(), 0, 300)
            );
        }

        foreach ($response->json('candidates.0.content.parts', []) as $part) {
            $inline = $part['inlineData'] ?? $part['inline_data'] ?? null;
            if (! empty($inline['data'])) {
                return $inline['data'];
            }
        }

        throw new RuntimeException('Gemini no devolvio datos de imagen en la respuesta.');
    }

    protected function promptComposicionManiqui(): string
    {
        return implode(' ', [
            'The first image shows a garment (product photo).',
            'The second image shows an empty mannequin.',
            'Dress the mannequin from the second image with the garment from the first image.',
            'Preserve the exact design, colors, patterns and texture of the garment.',
            'Place it naturally on the mannequin as it would be worn.',
            'Clean, neutral studio background, soft even product lighting, photorealistic e-commerce catalog photo.',
            'Do not add logos, text or watermarks.',
        ]);
    }

    protected function asegurarApiKey(): void
    {
        if (empty($this->apiKey)) {
            throw new RuntimeException(
                'GEMINI_API_KEY no configurada. Agrega la key en .env antes de usar el modulo IA.'
            );
        }
    }

    protected function stub(string $metodo, array $payload): string
    {
        // TODO: implementar integracion real de texto con Gemini.
        throw new RuntimeException(
            'GeminiService::'.$metodo.'() aun no implementado. Configura GEMINI_API_KEY e implementa la llamada.'
        );
    }
}
