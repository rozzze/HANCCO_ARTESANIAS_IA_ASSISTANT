import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import { Pedido, EstadoPedido } from '../models/pedido.model';

export interface PedidoAdminFiltros {
  estado_pedido?: EstadoPedido | '';
  cliente_id?: number;
  buscar?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  per_page?: number;
}

export interface MisPedidosFiltros {
  estado_pedido?: EstadoPedido | '';
  page?: number;
  per_page?: number;
}

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  misPedidos(filtros: MisPedidosFiltros = {}): Observable<ApiResponse<Pedido[]>> {
    return this.http.get<ApiResponse<Pedido[]>>(`${this.apiUrl}/pedidos`, {
      params: this.buildParams(filtros),
    });
  }

  miPedido(id: number): Observable<ApiResponse<Pedido>> {
    return this.http.get<ApiResponse<Pedido>>(`${this.apiUrl}/pedidos/${id}`);
  }

  checkout(direccionEnvio: string, telefono: string, notas?: string): Observable<ApiResponse<Pedido>> {
    return this.http.post<ApiResponse<Pedido>>(`${this.apiUrl}/pedidos/checkout`, {
      direccion_envio: direccionEnvio,
      telefono,
      notas,
    });
  }

  listarAdmin(filtros: PedidoAdminFiltros = {}): Observable<PaginatedResponse<Pedido>> {
    return this.http.get<PaginatedResponse<Pedido>>(`${this.apiUrl}/admin/pedidos`, {
      params: this.buildParams(filtros),
    });
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

  private buildParams(filtros: object): HttpParams {
    let params = new HttpParams();
    Object.entries(filtros as Record<string, unknown>).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') params = params.set(k, String(v));
    });
    return params;
  }
}
