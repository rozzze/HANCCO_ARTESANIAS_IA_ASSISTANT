import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Categoria } from '../models/categoria.model';

export interface Maniqui {
  id: number;
  nombre: string;
  slug: string;
  categoria_id: number | null;
  categoria?: Categoria;
  url_referencia: string;
  descripcion: string | null;
  activo: boolean;
}

export interface ManiquiDatos {
  nombre: string;
  categoria_id: number | null;
  descripcion: string;
  activo: boolean;
  imagen?: File;
}

@Injectable({ providedIn: 'root' })
export class ManiquiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listarPublico(categoriaId?: number): Observable<ApiResponse<Maniqui[]>> {
    return this.http.get<ApiResponse<Maniqui[]>>(`${this.apiUrl}/maniquies`, {
      params: this.buildParams(categoriaId),
    });
  }

  listarAdmin(categoriaId?: number): Observable<ApiResponse<Maniqui[]>> {
    return this.http.get<ApiResponse<Maniqui[]>>(`${this.apiUrl}/admin/maniquies`, {
      params: this.buildParams(categoriaId),
    });
  }

  crear(data: ManiquiDatos): Observable<ApiResponse<Maniqui>> {
    return this.http.post<ApiResponse<Maniqui>>(`${this.apiUrl}/admin/maniquies`, this.buildFormData(data));
  }

  actualizar(id: number, data: ManiquiDatos): Observable<ApiResponse<Maniqui>> {
    const fd = this.buildFormData(data);
    fd.append('_method', 'PUT');
    return this.http.post<ApiResponse<Maniqui>>(`${this.apiUrl}/admin/maniquies/${id}`, fd);
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/admin/maniquies/${id}`);
  }

  private buildParams(categoriaId?: number): HttpParams {
    let params = new HttpParams();
    if (categoriaId !== undefined && categoriaId !== null) {
      params = params.set('categoria_id', String(categoriaId));
    }
    return params;
  }

  private buildFormData(data: ManiquiDatos): FormData {
    const fd = new FormData();
    fd.append('nombre', data.nombre);
    if (data.categoria_id !== null && data.categoria_id !== undefined) {
      fd.append('categoria_id', String(data.categoria_id));
    }
    fd.append('descripcion', data.descripcion ?? '');
    fd.append('activo', data.activo ? '1' : '0');
    if (data.imagen) {
      fd.append('imagen', data.imagen);
    }
    return fd;
  }
}
