import { Producto } from './producto.model';

export interface DetalleCarrito {
  id: number;
  carrito_id: number;
  producto_id: number;
  producto?: Producto;
  producto_talla_id: number | null;
  talla?: string | null;
  stock_talla?: number | null;
  cantidad: number;
  subtotal: number;
}

export interface Carrito {
  id: number;
  cliente_id: number;
  total: number;
  estado: 'activo' | 'procesado' | 'abandonado';
  detalles?: DetalleCarrito[];
  items_count?: number;
  created_at?: string;
}