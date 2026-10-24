import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MetodoPago {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
}

export interface CulqiCuota {
  id: string;
  nombre: string;
  monto_mult: number;
}

export interface CheckoutConfig {
  culqi: {
    public_key: string;
    env: string;
    activo: boolean;
  };
  metodos_pago: MetodoPago[];
  yape: {
    numero: string;
    qr_url: string;
  };
  whatsapp_tienda: string;
  culqi_cuotas: CulqiCuota[];
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  private readonly _config = signal<CheckoutConfig | null>(null);
  readonly config = this._config.asReadonly();

  obtenerConfig(): Observable<{ data: CheckoutConfig }> {
    const cacheada = this._config();
    if (cacheada) {
      return of({ data: cacheada });
    }

    return new Observable((observer) => {
      this.http.get<{ data: CheckoutConfig }>(`${this.apiUrl}/checkout/config`).subscribe({
        next: (res) => {
          this._config.set(res.data);
          observer.next(res);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }
}