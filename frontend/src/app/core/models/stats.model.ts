export interface VentasMes {
  total: number;
  cantidad: number;
  delta_pct: number | null;
}

export interface PuntoIngreso {
  fecha: string;
  total: number;
}

export interface TopProducto {
  producto_id: number;
  nombre: string;
  cantidad: number;
  total: number;
}

export interface ProductoStockCritico {
  id: number;
  nombre: string;
  slug: string;
  stock_disponible: number;
  imagen_principal_url: string | null;
}

export interface Stats {
  ventas_mes: VentasMes;
  pedidos_pendientes: number;
  comprobantes_pendientes: number;
  productos_stock_bajo: number;
  ingresos_14d: PuntoIngreso[];
  top_productos: TopProducto[];
  stock_critico: ProductoStockCritico[];
}
