import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listar(filtros: { rol?: string; buscar?: string } = {}): Observable<any> {
    let params = new HttpParams();
    if (filtros.rol) params = params.set('rol', filtros.rol);
    if (filtros.buscar) params = params.set('buscar', filtros.buscar);
    return this.http.get(`${this.apiUrl}/admin/usuarios`, { params });
  }

  obtener(id: number): Observable<ApiResponse<Usuario>> {
    return this.http.get<ApiResponse<Usuario>>(`${this.apiUrl}/admin/usuarios/${id}`);
  }

  actualizar(id: number, data: Partial<Usuario>): Observable<ApiResponse<Usuario>> {
    return this.http.put<ApiResponse<Usuario>>(`${this.apiUrl}/admin/usuarios/${id}`, data);
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/admin/usuarios/${id}`);
  }
}