<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DetallePedido;
use App\Models\Pedido;
use App\Models\Producto;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    protected const UMBRAL_STOCK_BAJO = 3;

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => [
                'ventas_mes' => $this->ventasMes(),
                'pedidos_pendientes' => $this->pedidosPendientes(),
                'comprobantes_pendientes' => $this->comprobantesPendientes(),
                'productos_stock_bajo' => $this->productosStockBajo(),
                'ingresos_14d' => $this->ingresosUltimosDias(14),
                'top_productos' => $this->topProductos(5, 30),
                'stock_critico' => $this->stockCritico(6),
            ],
        ]);
    }

    protected function ventasMes(): array
    {
        $rangoActual = [now()->startOfMonth(), now()->endOfMonth()];
        $rangoPrevio = [
            now()->subMonthNoOverflow()->startOfMonth(),
            now()->subMonthNoOverflow()->endOfMonth(),
        ];

        $total = (float) Pedido::where('estado_pedido', '!=', 'cancelado')
            ->whereBetween('fecha_pedido', $rangoActual)
            ->sum('total');

        $cantidad = Pedido::where('estado_pedido', '!=', 'cancelado')
            ->whereBetween('fecha_pedido', $rangoActual)
            ->count();

        $previo = (float) Pedido::where('estado_pedido', '!=', 'cancelado')
            ->whereBetween('fecha_pedido', $rangoPrevio)
            ->sum('total');

        $delta = $previo > 0
            ? round((($total - $previo) / $previo) * 100, 1)
            : null;

        return [
            'total' => round($total, 2),
            'cantidad' => $cantidad,
            'delta_pct' => $delta,
        ];
    }

    protected function pedidosPendientes(): int
    {
        return Pedido::where('estado_pedido', 'pendiente')->count();
    }

    protected function comprobantesPendientes(): int
    {
        return Pedido::where('estado_pedido', 'pendiente')
            ->whereHas('pago', function ($q) {
                $q->where('estado_pago', 'pendiente')
                    ->whereNotNull('comprobante_url');
            })
            ->count();
    }

    protected function productosStockBajo(): int
    {
        return Producto::where('activo', true)
            ->where('stock_disponible', '<=', self::UMBRAL_STOCK_BAJO)
            ->count();
    }

    protected function ingresosUltimosDias(int $dias): array
    {
        $inicio = now()->subDays($dias - 1)->startOfDay();

        $porDia = Pedido::where('estado_pedido', '!=', 'cancelado')
            ->where('fecha_pedido', '>=', $inicio)
            ->selectRaw('DATE(fecha_pedido) as dia, SUM(total) as suma')
            ->groupBy('dia')
            ->pluck('suma', 'dia');

        $serie = [];
        for ($i = $dias - 1; $i >= 0; $i--) {
            $fecha = now()->subDays($i);
            $clave = $fecha->toDateString();

            $serie[] = [
                'fecha' => $clave,
                'total' => round((float) ($porDia[$clave] ?? 0), 2),
            ];
        }

        return $serie;
    }

    protected function topProductos(int $limite, int $dias): array
    {
        return DetallePedido::query()
            ->join('pedidos', 'pedidos.id', '=', 'detalle_pedidos.pedido_id')
            ->join('productos', 'productos.id', '=', 'detalle_pedidos.producto_id')
            ->where('pedidos.estado_pedido', '!=', 'cancelado')
            ->where('pedidos.fecha_pedido', '>=', now()->subDays($dias)->startOfDay())
            ->groupBy('detalle_pedidos.producto_id', 'productos.nombre')
            ->selectRaw('
                detalle_pedidos.producto_id as producto_id,
                productos.nombre as nombre,
                SUM(detalle_pedidos.cantidad) as cantidad,
                SUM(detalle_pedidos.subtotal) as total
            ')
            ->orderByDesc('cantidad')
            ->limit($limite)
            ->get()
            ->map(fn ($fila) => [
                'producto_id' => (int) $fila->producto_id,
                'nombre' => $fila->nombre,
                'cantidad' => (int) $fila->cantidad,
                'total' => round((float) $fila->total, 2),
            ])
            ->all();
    }

    protected function stockCritico(int $limite): array
    {
        return Producto::where('activo', true)
            ->where('stock_disponible', '<=', self::UMBRAL_STOCK_BAJO)
            ->with('imagenes:id,producto_id,url_cloudflare_s3,es_principal,orden')
            ->orderBy('stock_disponible')
            ->orderBy('nombre')
            ->limit($limite)
            ->get()
            ->map(function (Producto $p) {
                $principal = $p->imagenes->firstWhere('es_principal', true) ?? $p->imagenes->first();

                return [
                    'id' => $p->id,
                    'nombre' => $p->nombre,
                    'slug' => $p->slug,
                    'stock_disponible' => $p->stock_disponible,
                    'imagen_principal_url' => $principal?->url_cloudflare_s3,
                ];
            })
            ->all();
    }
}
