import { Injectable, signal } from '@angular/core';

export type ToastTipo = 'success' | 'error' | 'warning' | 'info';

export interface ToastMensaje {
  id: number;
  tipo: ToastTipo;
  texto: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<ToastMensaje[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private contador = 0;

  mostrar(texto: string, tipo: ToastTipo = 'info', duracion = 4000): void {
    const id = ++this.contador;
    this._toasts.update((lista) => [...lista, { id, tipo, texto }]);
    if (duracion > 0) {
      setTimeout(() => this.cerrar(id), duracion);
    }
  }

  success(texto: string): void {
    this.mostrar(texto, 'success');
  }

  error(texto: string): void {
    this.mostrar(texto, 'error', 5500);
  }

  warning(texto: string): void {
    this.mostrar(texto, 'warning', 5000);
  }

  info(texto: string): void {
    this.mostrar(texto, 'info');
  }

  cerrar(id: number): void {
    this._toasts.update((lista) => lista.filter((t) => t.id !== id));
  }
}
