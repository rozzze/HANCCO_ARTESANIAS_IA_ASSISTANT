import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pago } from '../models/pago.model';
import { Pedido } from '../models/pedido.model';

export type MetodoPagoId = 'tarjeta' | 'yape' | 'plin' | 'transferencia' | 'contraentrega';

export interface RegistrarPagoDatos {
  metodo_pago: MetodoPagoId;
  transaccion_id?: string;
  culqi_token?: string;
  metadata?: any;
  comprobante?: File | null;
}

@Injectable({ providedIn: 'root' })
export class PagoService {
  private readonly apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  registrar(pedidoId: number, data: RegistrarPagoDatos): Observable<{ message: string; data: { pago: Pago; pedido: Pedido } }> {
    if (data.comprobante) {
      const fd = new FormData();
      fd.append('metodo_pago', data.metodo_pago);
      if (data.transaccion_id) fd.append('transaccion_id', data.transaccion_id);
      fd.append('comprobante', data.comprobante);
      return this.http.post<{ message: string; data: { pago: Pago; pedido: Pedido } }>(
        `${this.apiUrl}/pedidos/${pedidoId}/pago`,
        fd
      );
    }

    return this.http.post<{ message: string; data: { pago: Pago; pedido: Pedido } }>(
      `${this.apiUrl}/pedidos/${pedidoId}/pago`,
      {
        metodo_pago: data.metodo_pago,
        transaccion_id: data.transaccion_id,
        culqi_token: data.culqi_token,
        metadata: data.metadata,
      }
    );
  }
}
