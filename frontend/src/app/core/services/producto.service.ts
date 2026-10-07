import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import { Producto } from '../models/producto.model';

export interface ProductoPayload extends Partial<Omit<Producto, 'tallas'>> {
  tallas?: { talla: string; stock_disponible: number }[];
}

export type ProductoOrdenar = 'recientes' | 'precio_asc' | 'precio_desc' | 'nombre';

export interface ProductoFiltros {
  categoria_id?: number;
  categoria_slug?: string;
  material?: string;
  color?: string;
  talla?: string;
  buscar?: string;
  precio_min?: number;
  precio_max?: number;
  ordenar?: ProductoOrdenar;
  per_page?: number;
  page?: number;
}

export type ProductoAdminOrdenar = ProductoOrdenar | 'stock_asc' | 'stock_desc';

export interface ProductoAdminFiltros extends Omit<ProductoFiltros, 'ordenar' | 'categoria_slug'> {
  activo?: boolean;
  stock_bajo?: number;
  ordenar?: ProductoAdminOrdenar;
}

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listarPublico(filtros: ProductoFiltros = {}): Observable<PaginatedResponse<Producto>> {
    return this.http.get<PaginatedResponse<Producto>>(`${this.apiUrl}/productos`, {
      params: this.buildParams(filtros),
    });
  }

  obtenerPublico(id: number): Observable<ApiResponse<Producto>> {
    return this.http.get<ApiResponse<Producto>>(`${this.apiUrl}/productos/${id}`);
  }

  listarAdmin(filtros: ProductoAdminFiltros = {}): Observable<PaginatedResponse<Producto>> {
    return this.http.get<PaginatedResponse<Producto>>(`${this.apiUrl}/admin/productos`, {
      params: this.buildParams(filtros),
    });
  }

  obtenerAdmin(id: number): Observable<ApiResponse<Producto>> {
    return this.http.get<ApiResponse<Producto>>(`${this.apiUrl}/admin/productos/${id}`);
  }

  crear(data: ProductoPayload): Observable<ApiResponse<Producto>> {
    return this.http.post<ApiResponse<Producto>>(`${this.apiUrl}/admin/productos`, data);
  }

  actualizar(id: number, data: ProductoPayload): Observable<ApiResponse<Producto>> {
    return this.http.put<ApiResponse<Producto>>(`${this.apiUrl}/admin/productos/${id}`, data);
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/admin/productos/${id}`);
  }

  actualizarStock(id: number, productoTallaId: number, stock: number, operacion: 'establecer' | 'incrementar' | 'decrementar' = 'establecer'): Observable<ApiResponse<Producto>> {
    return this.http.patch<ApiResponse<Producto>>(`${this.apiUrl}/admin/productos/${id}/stock`, {
      producto_talla_id: productoTallaId,
      stock_disponible: stock,
      operacion,
    });
  }

  generarDescripcion(id: number): Observable<ApiResponse<{ descripcion: string }>> {
    return this.http.post<ApiResponse<{ descripcion: string }>>(`${this.apiUrl}/admin/productos/${id}/generar-descripcion`, {});
  }

  private buildParams(filtros: any): HttpParams {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([key, value]: [string, unknown]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}