import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Carrito, DetalleCarrito } from '../models/carrito.model';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly apiUrl = environment.apiUrl;

  private readonly _carrito = signal<Carrito | null>(null);
  readonly carrito = this._carrito.asReadonly();
  readonly total = computed(() => this._carrito()?.total ?? 0);
  readonly cantidadItems = computed(() => {
    const det = this._carrito()?.detalles;
    return det ? det.reduce((acc, d) => acc + d.cantidad, 0) : 0;
  });

  constructor(private http: HttpClient) {}

  obtener(): Observable<ApiResponse<Carrito>> {
    return this.http
      .get<ApiResponse<Carrito>>(`${this.apiUrl}/carrito`)
      .pipe(tap((res) => this._carrito.set(res.data)));
  }

  agregar(productoId: number, productoTallaId: number, cantidad: number): Observable<ApiResponse<Carrito>> {
    return this.http
      .post<ApiResponse<Carrito>>(`${this.apiUrl}/carrito/items`, {
        producto_id: productoId,
        producto_talla_id: productoTallaId,
        cantidad,
      })
      .pipe(tap((res) => this._carrito.set(res.data)));
  }

  actualizarCantidad(detalleId: number, cantidad: number): Observable<ApiResponse<Carrito>> {
    return this.http
      .patch<ApiResponse<Carrito>>(`${this.apiUrl}/carrito/items/${detalleId}`, { cantidad })
      .pipe(tap((res) => this._carrito.set(res.data)));
  }

  eliminar(detalleId: number): Observable<ApiResponse<Carrito>> {
    return this.http
      .delete<ApiResponse<Carrito>>(`${this.apiUrl}/carrito/items/${detalleId}`)
      .pipe(tap((res) => this._carrito.set(res.data)));
  }

  vaciar(): Observable<ApiResponse<Carrito>> {
    return this.http
      .delete<ApiResponse<Carrito>>(`${this.apiUrl}/carrito`)
      .pipe(tap((res) => this._carrito.set(res.data)));
  }

  limpiar(): void {
    this._carrito.set(null);
  }
}