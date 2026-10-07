import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pago } from '../models/pago.model';
import { Pedido } from '../models/pedido.model';

export type MetodoPagoId = 'tarjeta' | 'yape' | 'plin' | 'transferencia' | 'contraentrega';

@Injectable({ providedIn: 'root' })
export class PagoService {
  private readonly apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  registrar(pedidoId: number, data: {
    metodo_pago: MetodoPagoId;
    transaccion_id?: string;
    culqi_token?: string;
    estado_pago?: 'pendiente' | 'completado' | 'fallido';
    metadata?: any;
  }): Observable<{ message: string; data: { pago: Pago; pedido: Pedido } }> {
    return this.http.post<{ message: string; data: { pago: Pago; pedido: Pedido } }>(
      `${this.apiUrl}/pedidos/${pedidoId}/pago`,
      data
    );
  }
}