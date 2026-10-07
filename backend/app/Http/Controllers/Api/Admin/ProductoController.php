<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductoResource;
use App\Models\Producto;
use App\Models\ProductoTalla;
use App\Services\CloudflareR2Service;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use RuntimeException;

class ProductoController extends Controller
{
    public function __construct(
        protected CloudflareR2Service $r2,
        protected GeminiService $gemini,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Producto::with(['categoria', 'imagenes', 'tallas']);

        if ($request->filled('buscar')) {
            $buscar = '%'.$request->string('buscar').'%';
            $query->where(function ($q) use ($buscar) {
                $q->where('nombre', 'like', $buscar)
                    ->orWhere('slug', 'like', $buscar)
                    ->orWhere('material', 'like', $buscar)
                    ->orWhere('color', 'like', $buscar);
            });
        }

        if ($request->filled('categoria_id')) {
            $query->where('categoria_id', $request->integer('categoria_id'));
        }

        if ($request->filled('material')) {
            $query->where('material', $request->string('material'));
        }

        if ($request->filled('color')) {
            $query->where('color', $request->string('color'));
        }

        if ($request->filled('talla')) {
            $query->whereHas('tallas', function ($q) use ($request) {
                $q->where('talla', $request->string('talla'));
            });
        }

        if ($request->filled('precio_min')) {
            $query->where('precio_venta', '>=', $request->float('precio_min'));
        }

        if ($request->filled('precio_max')) {
            $query->where('precio_venta', '<=', $request->float('precio_max'));
        }

        if ($request->filled('activo')) {
            $query->where('activo', $request->boolean('activo'));
        }

        if ($request->filled('stock_bajo')) {
            $query->where('stock_disponible', '<=', $request->integer('stock_bajo'));
        }

        $ordenar = $request->string('ordenar', 'recientes')->toString();
        match ($ordenar) {
            'precio_asc' => $query->orderBy('precio_venta', 'asc'),
            'precio_desc' => $query->orderBy('precio_venta', 'desc'),
            'nombre' => $query->orderBy('nombre', 'asc'),
            'stock_asc' => $query->orderBy('stock_disponible', 'asc'),
            'stock_desc' => $query->orderBy('stock_disponible', 'desc'),
            default => $query->latest(),
        };

        $perPage = min($request->integer('per_page', 24), 100);
        $productos = $query->paginate($perPage);

        return response()->json([
            'data' => ProductoResource::collection($productos),
            'meta' => [
                'current_page' => $productos->currentPage(),
                'last_page' => $productos->lastPage(),
                'per_page' => $productos->perPage(),
                'total' => $productos->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->reglasValidacion());

        $this->validarTallasUnicas($data['tallas']);

        $producto = DB::transaction(function () use ($data) {
            $producto = Producto::create(Arr::except($data, ['tallas']));
            $this->sincronizarTallas($producto, $data['tallas']);

            return $producto;
        });

        return response()->json([
            'message' => 'Producto creado.',
            'data' => new ProductoResource($producto->load(['categoria', 'imagenes', 'tallas'])),
        ], 201);
    }

    public function show(Producto $producto): JsonResponse
    {
        return response()->json([
            'data' => new ProductoResource(
                $producto->load(['categoria', 'imagenes', 'tallas'])
            ),
        ]);
    }

    public function update(Request $request, Producto $producto): JsonResponse
    {
        $data = $request->validate($this->reglasValidacion($producto->id));

        $this->validarTallasUnicas($data['tallas']);

        $slugAnterior = $producto->slug;

        DB::transaction(function () use ($producto, $data) {
            $producto->update(Arr::except($data, ['tallas']));
            $this->sincronizarTallas($producto, $data['tallas']);
        });

        if ($producto->wasChanged('slug') && $slugAnterior !== $producto->slug) {
            $this->migrarCarpetaImagenes($producto, $slugAnterior);
        }

        return response()->json([
            'message' => 'Producto actualizado.',
            'data' => new ProductoResource($producto->fresh()->load(['categoria', 'imagenes', 'tallas'])),
        ]);
    }

    protected function reglasValidacion(?int $productoId = null): array
    {
        $slugRule = $productoId === null
            ? 'unique:productos,slug'
            : 'unique:productos,slug,'.$productoId;

        return [
            'categoria_id' => ['required', 'integer', 'exists:categorias,id'],
            'nombre' => ['required', 'string', 'max:180'],
            'slug' => ['nullable', 'string', 'max:200', $slugRule],
            'material' => ['required', 'string', 'max:120'],
            'color' => ['required', 'string', 'max:60'],
            'precio_venta' => ['required', 'numeric', 'min:0'],
            'descripcion_manual' => ['nullable', 'string'],
            'descripcion_ia' => ['nullable', 'string'],
            'activo' => ['boolean'],
            'tallas' => ['required', 'array', 'min:1'],
            'tallas.*.talla' => ['required', 'string', Rule::in(ProductoTalla::TALLAS_DISPONIBLES)],
            'tallas.*.stock_disponible' => ['required', 'integer', 'min:0'],
        ];
    }

    protected function validarTallasUnicas(array $tallas): void
    {
        $unicas = collect($tallas)->pluck('talla')->unique()->count();

        if ($unicas !== count($tallas)) {
            abort(response()->json([
                'message' => 'Las tallas no pueden repetirse.',
            ], 422));
        }
    }

    protected function sincronizarTallas(Producto $producto, array $tallas): void
    {
        $enviadas = collect($tallas)->keyBy('talla');

        foreach ($producto->tallas()->get() as $existente) {
            if ($enviadas->has($existente->talla)) {
                $existente->update([
                    'stock_disponible' => (int) $enviadas[$existente->talla]['stock_disponible'],
                    'activo' => true,
                ]);
            } elseif ($existente->activo) {
                $existente->update(['activo' => false]);
            }
        }

        foreach ($enviadas as $talla => $datos) {
            $producto->tallas()->firstOrCreate(
                ['talla' => $talla],
                ['stock_disponible' => (int) $datos['stock_disponible'], 'activo' => true]
            );
        }

        $producto->sincronizarStockTotal();
    }

    protected function migrarCarpetaImagenes(Producto $producto, string $slugAnterior): void
    {
        $slugAnterior = Str::slug($slugAnterior);
        $slugNuevo = Str::slug($producto->slug);

        if ($slugAnterior === $slugNuevo || empty($slugAnterior)) {
            return;
        }

        $movidos = 0;
        try {
            $resultado = $this->r2->moverCarpeta($slugAnterior, $slugNuevo);
            $movidos = $resultado['movidos'] ?? 0;
        } catch (\Throwable $e) {
            \Log::warning('No se pudo migrar carpeta R2 al renombrar producto', [
                'producto_id' => $producto->id,
                'slug_anterior' => $slugAnterior,
                'slug_nuevo' => $slugNuevo,
                'error' => $e->getMessage(),
            ]);
        }

        foreach ($producto->imagenes()->get() as $imagen) {
            $nuevaUrl = str_replace(
                '/productos/'.$slugAnterior.'/',
                '/productos/'.$slugNuevo.'/',
                $imagen->url_cloudflare_s3
            );

            if ($nuevaUrl !== $imagen->url_cloudflare_s3) {
                $imagen->update(['url_cloudflare_s3' => $nuevaUrl]);
            }
        }

        if ($movidos > 0) {
            \Log::info("Migradas {$movidos} imagenes R2 de 'productos/{$slugAnterior}' a 'productos/{$slugNuevo}'", [
                'producto_id' => $producto->id,
            ]);
        }
    }

    public function destroy(Producto $producto): JsonResponse
    {
        DB::transaction(function () use ($producto) {
            $producto->imagenes()->delete();
            $producto->delete();
        });

        return response()->json([
            'message' => 'Producto eliminado.',
        ]);
    }

    public function actualizarStock(Request $request, Producto $producto): JsonResponse
    {
        $data = $request->validate([
            'producto_talla_id' => ['required', 'integer', 'exists:producto_tallas,id'],
            'stock_disponible' => ['required', 'integer', 'min:0'],
            'operacion' => ['nullable', 'in:establecer,incrementar,decrementar'],
        ]);

        $variante = $producto->tallas()->where('id', $data['producto_talla_id'])->firstOrFail();
        $operacion = $data['operacion'] ?? 'establecer';

        DB::transaction(function () use ($variante, $producto, $data, $operacion) {
            $nuevoStock = match ($operacion) {
                'incrementar' => $variante->stock_disponible + $data['stock_disponible'],
                'decrementar' => max(0, $variante->stock_disponible - $data['stock_disponible']),
                default => $data['stock_disponible'],
            };

            $variante->update(['stock_disponible' => $nuevoStock]);
            $producto->sincronizarStockTotal();
        });

        return response()->json([
            'message' => 'Stock actualizado.',
            'data' => new ProductoResource($producto->fresh()->load(['categoria', 'imagenes', 'tallas'])),
        ]);
    }

    public function generarDescripcion(Producto $producto): JsonResponse
    {
        $principal = $producto->load('imagenes')->imagenPrincipal();

        if (! $principal) {
            return response()->json([
                'message' => 'El producto no tiene imagen principal. Sube una imagen y marcala como principal primero.',
            ], 422);
        }

        try {
            $bytes = $this->r2->obtenerBytes($principal->url_cloudflare_s3);

            if ($bytes === null) {
                $bytes = @file_get_contents($principal->url_cloudflare_s3) ?: null;
            }

            if ($bytes === null) {
                throw new RuntimeException('No se pudo descargar la imagen principal del producto.');
            }

            $descripcion = $this->gemini->generarDescripcionDesdeImagen(
                base64_encode($bytes),
                $this->mimeDeUrl($principal->url_cloudflare_s3),
                $producto->nombre,
                $producto->material,
                $producto->color,
            );

            return response()->json([
                'message' => 'Descripcion generada con IA.',
                'data' => ['descripcion' => $descripcion],
            ]);
        } catch (RuntimeException $e) {
            Log::error('Fallo al generar descripcion IA', [
                'producto_id' => $producto->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Error al generar la descripcion con IA.',
                'detalle' => $e->getMessage(),
            ], 502);
        }
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
