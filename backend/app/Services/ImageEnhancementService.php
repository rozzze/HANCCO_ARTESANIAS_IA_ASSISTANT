<?php

namespace App\Services;

use App\Models\Imagen;
use App\Models\Maniqui;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class ImageEnhancementService
{
    public function __construct(
        protected CloudflareR2Service $r2,
        protected GeminiService $gemini,
    ) {}

    public function mejorarImagen(Imagen $imagen, int $maniquiId): Imagen
    {
        $maniqui = Maniqui::where('activo', true)->findOrFail($maniquiId);

        if (empty($maniqui->url_referencia)) {
            throw new RuntimeException(
                'El maniqui "'.$maniqui->nombre.'" no tiene imagen cargada. Editalo en Maniquies y sube una foto.'
            );
        }

        $producto = $imagen->producto()->firstOrFail();

        $prendaBytes = $this->descargar($imagen->url_cloudflare_s3);
        $maniquiBytes = $this->descargar($maniqui->url_referencia);

        $resultadoBase64 = $this->gemini->generarImagenManiqui(
            base64_encode($prendaBytes),
            $this->mimeDeUrl($imagen->url_cloudflare_s3),
            base64_encode($maniquiBytes),
            $this->mimeDeUrl($maniqui->url_referencia),
        );

        $this->reemplazarIaAnterior($producto->id, $imagen->id, $maniqui->id);

        $subida = $this->r2->subirDesdeBase64(
            $resultadoBase64,
            'png',
            $producto->slug,
            CloudflareR2Service::TIPO_IMAGEN_IA,
        );

        $nueva = $producto->imagenes()->create([
            'url_cloudflare_s3' => $subida['url'],
            'generada_ia' => true,
            'es_principal' => false,
            'orden' => $producto->imagenes()->count() + 1,
            'metadata_ia' => [
                'maniqui_id' => $maniqui->id,
                'maniqui_slug' => $maniqui->slug,
                'origen_imagen_id' => $imagen->id,
                'modelo' => config('services.gemini.model_image'),
                'fecha_generacion' => now()->toIso8601String(),
            ],
        ]);

        Log::info('Imagen IA generada', [
            'imagen_id' => $nueva->id,
            'producto_id' => $producto->id,
            'maniqui_id' => $maniqui->id,
        ]);

        return $nueva;
    }

    protected function reemplazarIaAnterior(int $productoId, int $origenImagenId, int $maniquiId): void
    {
        $previas = Imagen::where('producto_id', $productoId)
            ->where('generada_ia', true)
            ->where('metadata_ia->origen_imagen_id', $origenImagenId)
            ->where('metadata_ia->maniqui_id', $maniquiId)
            ->get();

        foreach ($previas as $previa) {
            if (! empty($previa->url_cloudflare_s3)) {
                $this->r2->eliminar($previa->url_cloudflare_s3);
            }
            $previa->delete();
        }
    }

    protected function descargar(string $url): string
    {
        $bytes = $this->r2->obtenerBytes($url);

        if ($bytes === null) {
            $bytes = @file_get_contents($url) ?: null;
        }

        if ($bytes === null || $bytes === '') {
            throw new RuntimeException('No se pudo descargar la imagen: '.$url);
        }

        return $bytes;
    }

    protected function mimeDeUrl(string $url): string
    {
        $extension = strtolower(pathinfo(parse_url($url, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION));

        return match ($extension) {
            'jpg', 'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            default => 'image/png',
        };
    }
}
