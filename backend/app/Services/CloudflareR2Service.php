<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CloudflareR2Service
{
    protected string $disk = 'cloudflare';

    public const TIPO_FOTO_REAL = 'foto_real';

    public const TIPO_IMAGEN_IA = 'imagenes_ia';

    public const CARPETA_MANIQUIES = 'maniquies';

    public function subirManiqui(UploadedFile $archivo, string $slugManiqui): array
    {
        $extension = $archivo->getClientOriginalExtension() ?: $archivo->extension();
        $nombreArchivo = Str::uuid().'.'.$extension;
        $ruta = self::CARPETA_MANIQUIES.'/'.Str::slug($slugManiqui).'/'.$nombreArchivo;

        $contenido = file_get_contents($archivo->getRealPath());

        Storage::disk($this->disk)->put($ruta, $contenido, [
            'visibility' => 'public',
            'ContentType' => $archivo->getMimeType(),
        ]);

        return [
            'ruta' => $ruta,
            'url' => $this->obtenerUrlPublica($ruta),
        ];
    }

    public function subir(UploadedFile $archivo, string $slugProducto, string $tipo = self::TIPO_FOTO_REAL): array
    {
        $extension = $archivo->getClientOriginalExtension() ?: $archivo->extension();
        $nombreArchivo = Str::uuid().'.'.$extension;
        $ruta = $this->construirRuta($slugProducto, $tipo, $nombreArchivo);

        $contenido = file_get_contents($archivo->getRealPath());

        Storage::disk($this->disk)->put($ruta, $contenido, [
            'visibility' => 'public',
            'ContentType' => $archivo->getMimeType(),
        ]);

        $urlPublica = $this->obtenerUrlPublica($ruta);

        return [
            'ruta' => $ruta,
            'url' => $urlPublica,
        ];
    }

    public function subirDesdeBase64(string $base64, string $extension, string $slugProducto, string $tipo = self::TIPO_FOTO_REAL): array
    {
        $contenido = base64_decode($base64);
        if ($contenido === false) {
            throw new \InvalidArgumentException('Base64 invalido.');
        }

        $nombreArchivo = Str::uuid().'.'.$extension;
        $ruta = $this->construirRuta($slugProducto, $tipo, $nombreArchivo);

        Storage::disk($this->disk)->put($ruta, $contenido, [
            'visibility' => 'public',
        ]);

        return [
            'ruta' => $ruta,
            'url' => $this->obtenerUrlPublica($ruta),
        ];
    }

    public function obtenerBytes(string $urlOpath): ?string
    {
        $ruta = $this->resolverRuta($urlOpath);
        if (! $ruta) {
            return null;
        }

        try {
            return Storage::disk($this->disk)->get($ruta) ?: null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function eliminar(string $urlOpath): bool
    {
        $ruta = $this->resolverRuta($urlOpath);
        if (! $ruta) {
            return false;
        }

        return Storage::disk($this->disk)->delete($ruta);
    }

    public function existe(string $urlOpath): bool
    {
        $ruta = $this->resolverRuta($urlOpath);
        if (! $ruta) {
            return false;
        }

        return Storage::disk($this->disk)->exists($ruta);
    }

    public function listarEnCarpeta(string $slugProducto, ?string $tipo = null): array
    {
        $prefijo = 'productos/'.Str::slug($slugProducto);
        if ($tipo !== null) {
            $prefijo .= '/'.trim($tipo, '/');
        }
        $prefijo .= '/';

        $archivos = Storage::disk($this->disk)->files($prefijo);

        return array_map(fn ($ruta) => [
            'ruta' => $ruta,
            'url' => $this->obtenerUrlPublica($ruta),
        ], $archivos);
    }

    public function moverCarpeta(string $slugViejo, string $slugNuevo): array
    {
        $slugViejo = Str::slug($slugViejo);
        $slugNuevo = Str::slug($slugNuevo);

        if ($slugViejo === $slugNuevo || empty($slugViejo) || empty($slugNuevo)) {
            return ['movidos' => 0, 'urls' => []];
        }

        $disk = Storage::disk($this->disk);
        $prefijoViejo = 'productos/'.$slugViejo.'/';

        $archivos = $disk->files($prefijoViejo);
        if (empty($archivos)) {
            return ['movidos' => 0, 'urls' => []];
        }

        $urlsActualizadas = [];

        foreach ($archivos as $rutaVieja) {
            $nombreArchivo = basename($rutaVieja);
            $rutaNueva = Str::replaceFirst($prefijoViejo, 'productos/'.$slugNuevo.'/', $rutaVieja);

            $disk->move($rutaVieja, $rutaNueva);
            $urlsActualizadas[$rutaVieja] = $this->obtenerUrlPublica($rutaNueva);
        }

        $disk->deleteDirectory('productos/'.$slugViejo);

        return [
            'movidos' => count($archivos),
            'urls' => $urlsActualizadas,
        ];
    }

    public function construirRuta(string $slugProducto, string $tipo, string $nombreArchivo): string
    {
        return 'productos/'.Str::slug($slugProducto).'/'.trim($tipo, '/').'/'.$nombreArchivo;
    }

    protected function obtenerUrlPublica(string $ruta): string
    {
        $baseUrl = rtrim(config('services.cloudflare_r2.public_url') ?? '', '/');

        if (! empty($baseUrl)) {
            return $baseUrl.'/'.ltrim($ruta, '/');
        }

        return Storage::disk($this->disk)->url($ruta);
    }

    public function resolverRutaParaImagen(string $urlOpath): ?string
    {
        return $this->resolverRuta($urlOpath);
    }

    protected function resolverRuta(string $urlOpath): ?string
    {
        if (empty($urlOpath)) {
            return null;
        }

        $baseUrl = rtrim(config('services.cloudflare_r2.public_url') ?? '', '/');

        if (! empty($baseUrl) && Str::startsWith($urlOpath, $baseUrl)) {
            return ltrim(Str::after($urlOpath, $baseUrl), '/');
        }

        if (filter_var($urlOpath, FILTER_VALIDATE_URL) !== false) {
            $partes = parse_url($urlOpath);

            return isset($partes['path']) ? ltrim($partes['path'], '/') : null;
        }

        return ltrim($urlOpath, '/');
    }
}
