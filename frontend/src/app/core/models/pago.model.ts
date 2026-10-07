export type EstadoPago = 'pendiente' | 'completado' | 'fallido' | 'reembolsado';
export type MetodoPago = 'tarjeta' | 'yape' | 'plin' | 'transferencia' | 'contraentrega';

export interface Pago {
  id: number;
  pedido_id: number;
  metodo_pago: MetodoPago;
  transaccion_id: string | null;
  monto: number;
  fecha_pago: string | null;
  estado_pago: EstadoPago;
  metadata: any | null;
}