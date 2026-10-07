import { Usuario } from './usuario.model';
import { Producto } from './producto.model';
import { Pago } from './pago.model';

export interface DetallePedido {
  id: number;
  pedido_id: number;
  producto_id: number;
  producto?: Producto;
  producto_talla_id: number | null;
  talla?: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export type EstadoPedido = 'pendiente' | 'pagado' | 'enviado' | 'entregado' | 'cancelado';

export interface Pedido {
  id: number;
  cliente_id: number;
  cliente?: Usuario;
  fecha_pedido: string;
  total: number;
  estado_pedido: EstadoPedido;
  direccion_envio: string | null;
  notas: string | null;
  detalles?: DetallePedido[];
  pago?: Pago;
  created_at?: string;
}