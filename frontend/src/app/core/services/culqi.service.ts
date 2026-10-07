import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

declare const Culqi: any;

export interface CulqiToken {
  id: string;
  email: string;
  card_number: string;
  last_four: string;
  brand: string;
  card_type: string;
  installments: number;
}

@Injectable({ providedIn: 'root' })
export class CulqiService {
  private readonly apiUrl = environment.apiUrl;
  private readonly _publicKey = signal<string>('');
  private readonly _env = signal<string>('sandbox');
  private readonly _configurado = signal<boolean>(false);

  readonly publicKey = this._publicKey.asReadonly();
  readonly env = this._env.asReadonly();
  readonly configurado = this._configurado.asReadonly();

  constructor(private http: HttpClient) {}

  cargarConfig(): Observable<{ data: { culqi: { public_key: string; env: string; activo: boolean } } }> {
    return new Observable((observer) => {
      this.http
        .get<{ data: { culqi: { public_key: string; env: string; activo: boolean } } }>(`${this.apiUrl}/checkout/config`)
        .subscribe({
          next: (res) => {
            this._publicKey.set(res.data.culqi.public_key);
            this._env.set(res.data.culqi.env);
            this._configurado.set(res.data.culqi.activo);
            observer.next(res);
            observer.complete();
          },
          error: (err) => observer.error(err),
        });
    });
  }

  inicializarCulqiJs(): void {
    if (!this._configurado()) {
      console.warn('Culqi no configurado en backend.');
      return;
    }
    if (typeof Culqi !== 'undefined') {
      Culqi.publicKey = this._publicKey();
    }
  }

  abrirFormularioCulqi(): Promise<CulqiToken> {
    return new Promise((resolve, reject) => {
      if (typeof Culqi === 'undefined') {
        reject(new Error('Culqi.js no cargado. Verifica conexion a internet.'));
        return;
      }

      if (!this._configurado()) {
        reject(new Error('Culqi no configurado en backend. Agrega CULQI_PUBLIC_KEY.'));
        return;
      }

      Culqi.publicKey = this._publicKey();
      Culqi.settings({
        title: 'Hancco Artesanias',
        currency: 'PEN',
        description: 'Pago de pedido',
        amount: 0,
      });

      Culqi.options({
        lang: 'es',
        style: {
          logo: '',
          maincolor: '#8B5A2B',
          buttontext: 'Pagar',
          maintext: '',
          desctext: '',
        },
        paymentMethods: {
          tarjeta: true,
          yape: true,
          billetera: true,
          cuotealo: true,
        },
      });

      (window as any).culqi = () => {
        if (Culqi.token) {
          resolve(Culqi.token as CulqiToken);
        } else {
          const error = Culqi.error || { user_message: 'Error desconocido' };
          reject(new Error(error.user_message || 'Error en el formulario Culqi.'));
        }
      };

      Culqi.open();
    });
  }
}