# Gemini API — Setup y guia de integracion

## Estado actual

- **Key actual** (`AQ.Ab8R...`): NO tiene habilitado image generation.
- Funciona solo para **texto** y **vision** (input imagen → output texto).
- **Causa**: key es de proyecto nuevo. Google cambio politica en 2025: nuevos usuarios free tier ya NO incluyen image generation. Solo planes pagos (incluso con tarjeta) la tienen.
- **Solucion**: activar billing en Google Cloud.

## Costo

| Concepto | Monto |
|---|---|
| Adelanto minimo Google Cloud | ~S/ 40 PEN (~$11 USD) |
| Free credits cuenta nueva GCP | $300 USD (90 dias) |
| Costo por imagen generada | $0.0003 - $0.03 USD |
| 100 pruebas tipicas | S/ 1 - 4 PEN |

## Modelos disponibles (con billing activo)

| Modelo | Tipo | Costo imagen | Recomendado para |
|---|---|---|---|
| `gemini-2.5-flash` | Texto / vision | No genera | Descripciones |
| `gemini-2.5-flash-image` | Texto + imagen output | ~$0.001 | Default titulacion |
| `gemini-3.1-flash-image` | Texto + imagen output | ~$0.002 | Alternativa moderna |
| `gemini-3.1-flash-image-preview` | Texto + imagen output | ~$0.002 | Preview |
| `nano-banana-pro-preview` | Imagen output | ~$0.005 | Alias oficial |
| `gemini-3-pro-image-preview` | Texto + imagen output | ~$0.01 | Calidad maxima |

## Free tier limits (con billing)

- 15 requests / minuto
- 1,500 requests / dia
- 1,000,000 tokens / dia

Mas que suficiente para titulacion.

---

## Paso a paso: activar billing

### 1. Google Cloud Console

URL: `https://console.cloud.google.com/`

Login con la cuenta Google de AI Studio.

### 2. Seleccionar o crear proyecto

- Click selector de proyecto (arriba a la izquierda)
- Si no existe: **New Project** → nombre `hancco-ia` → Create

### 3. Vincular billing

- Menu lateral → **Billing**
- **Create billing account**
- Llenar:
  - Nombre: `Hancco Personal`
  - Pais: Peru
  - Moneda: USD
  - Tarjeta debito/credito
- **Create and enable**

### 4. Habilitar Generative Language API

- Menu: **APIs & Services** → **Library**
- Buscar: `Generative Language API`
- Click → **Enable**

### 5. Budget alert (RECOMENDADO)

URL: `https://console.cloud.google.com/billing/budgets`

- Crear budget: $5 USD
- Alertas: 50%, 90%, 100%
- Email notification

### 6. Obtener / regenerar API key

URL: `https://aistudio.google.com/app/apikey`

- Click **Create API key**
- Seleccionar proyecto con billing
- Formato esperado: `AIzaSy...` (39 caracteres)
- **Copiar y guardar en lugar seguro. NUNCA en chat ni en Git.**

---

## Variables de entorno

Agregar a `backend/.env`:

```env
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash-image
GEMINI_TIMEOUT=60
```

---

## Endpoints de la API

### Generar texto (vision input)

```http
POST https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent
Headers:
  x-goog-api-key: TU_KEY
  Content-Type: application/json

Body:
{
  "contents": [{
    "parts": [
      {"text": "Describe esta imagen"},
      {"inline_data": {"mime_type": "image/jpeg", "data": "<BASE64>"}}
    ]
  }]
}
```

### Generar imagen (input + output imagen)

```http
POST https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent
Body:
{
  "contents": [{
    "parts": [
      {"text": "<PROMPT_TEXTO>"},
      {"inline_data": {"mime_type": "image/jpeg", "data": "<BASE64>"}}
    ]
  }],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"]
  }
}
```

### Respuesta exitosa

```json
{
  "candidates": [{
    "content": {
      "parts": [
        {"text": "Texto del modelo..."},
        {"inline_data": {"mime_type": "image/png", "data": "<BASE64_IMAGEN>"}}
      ]
    }
  }]
}
```

La imagen generada esta en `candidates[0].content.parts[].inline_data.data`.

---

## Errores comunes

| Codigo | Causa | Solucion |
|---|---|---|
| 401 | Key invalida | Regenerar key |
| 403 | Key restringida por IP/referer | Verificar config de key |
| 404 | Modelo no existe o deshabilitado | Probar otro modelo |
| 429 limit 0 | Free tier sin image generation | Activar billing |
| 429 limit N | Cuota excedida | Esperar 1 min o upgrade plan |
| 503 | Modelo sobrecargado | Reintentar |
| 504 | Timeout | Aumentar GEMINI_TIMEOUT |

---

## Test rapido (curl)

```bash
KEY="AIzaSy..."
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
  -H "x-goog-api-key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"say hi"}]}],"generationConfig":{"responseModalities":["TEXT","IMAGE"]}}'
```

**Esperado:** HTTP 200 con JSON.

---

## Archivos backend a modificar cuando se implemente

1. `backend/.env` → agregar GEMINI_API_KEY, GEMINI_MODEL, GEMINI_TIMEOUT
2. `backend/app/Services/GeminiService.php` → implementar `generarImagenManiqui()` y `mejorarDescripcion()`
3. `backend/app/Services/ImageEnhancementService.php` → completar orquestacion

## Estructura del prompt para generar imagen de producto

```
Eres un estudio fotografico profesional de e-commerce.

Recibes:
- Imagen de una prenda de fibra de alpaca
- Tipo de maniqui: {maniqui_slug}
- Fondo: {fondo_slug}

Tu tarea: genera una foto profesional donde la prenda este siendo
exhibida sobre el maniqui indicado, con el fondo especificado.

Requisitos:
- Iluminacion suave, estilo catalogo
- Producto centrado y claramente visible
- Texturas de alpaca visibles
- Aspecto profesional, alta calidad
- Fondo coherente con la industria textil andina
```

### Fondos disponibles

- `estudio_blanco` - Estudio blanco limpio
- `beige` - Fondo beige calido
- `taller_artesanal` - Interior de taller con telares
- `paisaje_andino` - Exterior con montanas
- `gradient_calido` - Gradient marrones/cremas

### Maniquies disponibles

- `mujer-adulta`
- `hombre-adulto`
- `nino`
- `nina`

---

## Test desde Laravel Tinker (cuando se implemente)

```bash
cd /Users/isac/titulacion/backend
php artisan tinker
```

```php
$svc = app(\App\Services\GeminiService::class);
$base64 = base64_encode(file_get_contents('/tmp/chompa.jpg'));
$resultado = $svc->generarImagenManiqui($base64, 'mujer-adulta', 'estudio_blanco');
echo "Imagen base64 chars: " . strlen($resultado['imagen_base64']);
// Esperado: > 1000 chars = OK
```

---

## Implementacion de referencia (cuando se active billing)

### `app/Services/GeminiService.php`

```php
public function generarImagenManiqui(
    string $imagenBase64,
    string $maniquiSlug,
    string $fondo
): array {
    $prompt = $this->construirPrompt($maniquiSlug, $fondo);

    $response = Http::timeout($this->timeout)
        ->withHeaders(['x-goog-api-key' => $this->apiKey])
        ->post(
            "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent",
            [
                'contents' => [[
                    'parts' => [
                        ['text' => $prompt],
                        ['inline_data' => [
                            'mime_type' => 'image/jpeg',
                            'data' => $imagenBase64,
                        ]],
                    ],
                ]],
                'generationConfig' => [
                    'responseModalities' => ['TEXT', 'IMAGE'],
                ],
            ]
        );

    if ($response->failed()) {
        throw new \RuntimeException('Gemini error: ' . $response->body());
    }

    $parts = $response->json('candidates.0.content.parts') ?? [];

    foreach ($parts as $part) {
        if (isset($part['inline_data']['data'])) {
            return [
                'imagen_base64' => $part['inline_data']['data'],
                'mime_type' => $part['inline_data']['mime_type'] ?? 'image/png',
                'texto' => $this->extraerTexto($parts),
            ];
        }
    }

    throw new \RuntimeException('Gemini no devolvio imagen.');
}

private function construirPrompt(string $maniquiSlug, string $fondo): string
{
    $maniquis = [
        'mujer-adulta' => 'maniqui de mujer adulta',
        'hombre-adulto' => 'maniqui de hombre adulto',
        'nino' => 'maniqui de nino',
        'nina' => 'maniqui de nina',
    ];
    $fondos = [
        'estudio_blanco' => 'fondo de estudio blanco limpio, iluminacion profesional',
        'beige' => 'fondo beige calido, estilo minimalista',
        'taller_artesanal' => 'interior de taller artesanal andino con telares al fondo',
        'paisaje_andino' => 'exterior con paisaje andino, montanas y cielo',
        'gradient_calido' => 'gradient de marrones y cremas',
    ];

    $m = $maniquis[$maniquiSlug] ?? 'maniqui';
    $f = $fondos[$fondo] ?? 'fondo neutro';

    return "Eres un estudio fotografico profesional de e-commerce.\n\n"
        . "Genera una foto de la prenda recibida sobre un {$m}, con {$f}.\n\n"
        . "Requisitos: iluminacion suave, producto centrado y visible, "
        . "texturas de alpaca visibles, estilo catalogo, alta calidad.";
}
```

### `app/Services/ImageEnhancementService.php`

```php
public function mejorarImagen(Imagen $imagen, string $maniquiSlug, string $fondo): Imagen
{
    $bytes = $this->descargarR2($imagen->url_cloudflare_s3);
    $base64 = base64_encode($bytes);

    $resultado = $this->gemini->generarImagenManiqui($base64, $maniquiSlug, $fondo);

    $extension = explode('/', $resultado['mime_type'])[1] ?? 'png';
    $subida = $this->r2->subirDesdeBase64(
        $resultado['imagen_base64'],
        $extension,
        $imagen->producto->slug,
        CloudflareR2Service::TIPO_IMAGEN_IA
    );

    $imagen->update([
        'url_cloudflare_s3' => $subida['url'],
        'generada_ia' => true,
        'metadata_ia' => [
            'maniqui' => $maniquiSlug,
            'fondo' => $fondo,
            'fecha_generacion' => now()->toISOString(),
            'texto_modelo' => $resultado['texto'] ?? null,
        ],
    ]);

    return $imagen->fresh();
}

protected function descargarR2(string $url): string
{
    $response = \Illuminate\Support\Facades\Http::timeout(30)->get($url);
    if ($response->failed()) {
        throw new \RuntimeException("No se pudo descargar imagen de R2: {$url}");
    }
    return $response->body();
}
```

---

## Estado de implementacion

- [x] Stubs creados con `// TODO` y `NotImplementedException`
- [ ] Billing activado en Google Cloud
- [ ] Key valida para image generation
- [ ] `GeminiService::generarImagenManiqui()` implementado
- [ ] `ImageEnhancementService::mejorarImagen()` completo
- [ ] Test end-to-end con producto real

**El frontend YA esta listo.** El modulo IA en `/admin/productos/:id/imagenes` mostrara el error 501 con mensaje claro hasta que backend este implementado.