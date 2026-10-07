import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Pedido, EstadoPedido } from '../models/pedido.model';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  misPedidos(): Observable<ApiResponse<Pedido[]>> {
    return this.http.get<ApiResponse<Pedido[]>>(`${this.apiUrl}/pedidos`);
  }

  miPedido(id: number): Observable<ApiResponse<Pedido>> {
    return this.http.get<ApiResponse<Pedido>>(`${this.apiUrl}/pedidos/${id}`);
  }

  checkout(direccionEnvio: string, notas?: string): Observable<ApiResponse<Pedido>> {
    return this.http.post<ApiResponse<Pedido>>(`${this.apiUrl}/pedidos/checkout`, {
      direccion_envio: direccionEnvio,
      notas,
    });
  }

  listarAdmin(filtros: { estado_pedido?: EstadoPedido; cliente_id?: number; desde?: string; hasta?: string } = {}): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/pedidos`, { params: this.buildParams(filtros) });
  }

  obtenerAdmin(id: number): Observable<ApiResponse<Pedido>> {
    return this.http.get<ApiResponse<Pedido>>(`${this.apiUrl}/admin/pedidos/${id}`);
  }

  actualizarEstado(id: number, estado: EstadoPedido, notas?: string): Observable<ApiResponse<Pedido>> {
    return this.http.put<ApiResponse<Pedido>>(`${this.apiUrl}/admin/pedidos/${id}`, {
      estado_pedido: estado,
      notas,
    });
  }

  private buildParams(filtros: Record<string, unknown>): any {
    const out: any = {};
    Object.entries(filtros).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') out[k] = v;
    });
    return out;
  }
}