import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Imagen } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ImagenService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listar(productoId: number): Observable<ApiResponse<Imagen[]>> {
    return this.http.get<ApiResponse<Imagen[]>>(`${this.apiUrl}/admin/productos/${productoId}/imagenes`);
  }

  obtener(id: number): Observable<ApiResponse<Imagen>> {
    return this.http.get<ApiResponse<Imagen>>(`${this.apiUrl}/admin/imagenes/${id}`);
  }

  subir(productoId: number, archivo: File, esPrincipal = false, orden?: number): Observable<ApiResponse<Imagen>> {
    const fd = new FormData();
    fd.append('imagen', archivo);
    if (esPrincipal) fd.append('es_principal', 'true');
    if (orden !== undefined) fd.append('orden', String(orden));
    return this.http.post<ApiResponse<Imagen>>(`${this.apiUrl}/admin/productos/${productoId}/imagenes`, fd);
  }

  actualizar(id: number, data: { es_principal?: boolean; orden?: number }): Observable<ApiResponse<Imagen>> {
    return this.http.patch<ApiResponse<Imagen>>(`${this.apiUrl}/admin/imagenes/${id}`, data);
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/admin/imagenes/${id}`);
  }

  mejorarConIa(id: number, maniquiId: number): Observable<ApiResponse<Imagen>> {
    return this.http.post<ApiResponse<Imagen>>(`${this.apiUrl}/admin/imagenes/${id}/mejorar-ia`, {
      maniqui_id: maniquiId,
    });
  }
}