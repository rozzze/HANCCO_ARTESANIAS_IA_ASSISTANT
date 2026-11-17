import { Injectable, NgZone, inject } from '@angular/core';
import { ACTIVITY_KEY, AUTH_STORAGE_KEYS, AuthService } from './auth.service';
import { ToastService } from './toast.service';

/** Minutos sin usar la pagina antes de cerrar la sesion. */
const MINUTOS_INACTIVIDAD = 30;
const LIMITE_MS = MINUTOS_INACTIVIDAD * 60 * 1000;

/** Cada cuanto revisamos si ya paso el limite. */
const INTERVALO_REVISION_MS = 15 * 1000;

/** Para no escribir en localStorage con cada movimiento del mouse. */
const ESPERA_ENTRE_REGISTROS_MS = 5 * 1000;

const EVENTOS_ACTIVIDAD = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];

/**
 * Cierra la sesion si el usuario no mueve el mouse, no escribe, no toca la
 * pantalla ni hace scroll durante MINUTOS_INACTIVIDAD.
 *
 * La hora de la ultima actividad se guarda en localStorage, asi todas las
 * pestañas abiertas la comparten: si usas la tienda en una pestaña, las
 * otras no te cierran la sesion. Y si se cierra en una, se cierra en todas.
 */
@Injectable({ providedIn: 'root' })
export class InactividadService {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private zone = inject(NgZone);

  private iniciado = false;
  private ultimoRegistro = 0;

  /** Se llama una sola vez al arrancar la app (en AppComponent). */
  iniciar(): void {
    if (this.iniciado) return;
    this.iniciado = true;

    // Fuera de la "zona" de Angular para que mover el mouse no
    // redibuje la pantalla miles de veces.
    this.zone.runOutsideAngular(() => {
      const registrar = () => this.registrarActividad();
      for (const evento of EVENTOS_ACTIVIDAD) {
        window.addEventListener(evento, registrar, { passive: true, capture: true });
      }
      setInterval(() => this.revisar(), INTERVALO_REVISION_MS);
      // Los navegadores frenan los timers de las pestañas en segundo plano,
      // asi que revisamos tambien cuando el usuario vuelve a la pestaña.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') this.revisar();
      });
      window.addEventListener('storage', (e) => this.alCambiarOtraPestana(e));
    });

    // Por si la pagina se abre tras horas sin uso (con el token aun guardado).
    this.revisar();
  }

  private registrarActividad(): void {
    if (!this.auth.isLoggedIn()) return;
    const ahora = Date.now();
    if (ahora - this.ultimoRegistro < ESPERA_ENTRE_REGISTROS_MS) return;
    // Si ya paso el limite, la actividad no "revive" la sesion: se cierra.
    if (this.inactivoDemasiado(ahora)) {
      this.revisar();
      return;
    }
    this.ultimoRegistro = ahora;
    localStorage.setItem(ACTIVITY_KEY, String(ahora));
  }

  private revisar(): void {
    if (!this.auth.isLoggedIn()) return;
    const ahora = Date.now();
    if (!localStorage.getItem(ACTIVITY_KEY)) {
      // Sesion iniciada antes de existir este control: empezamos a contar ya.
      localStorage.setItem(ACTIVITY_KEY, String(ahora));
      return;
    }
    if (this.inactivoDemasiado(ahora)) {
      this.zone.run(() =>
        this.auth.expirarSesion('Tu sesion se cerro por inactividad.', true),
      );
    }
  }

  private inactivoDemasiado(ahora: number): boolean {
    const ultima = Number(localStorage.getItem(ACTIVITY_KEY));
    return !!ultima && ahora - ultima >= LIMITE_MS;
  }

  /** Otra pestaña inicio o cerro sesion. */
  private alCambiarOtraPestana(e: StorageEvent): void {
    if (e.key !== AUTH_STORAGE_KEYS.token && e.key !== null) return;
    this.zone.run(() => {
      const perdioSesion = this.auth.sincronizarDesdeStorage();
      if (perdioSesion) {
        if (this.inactivoDemasiado(Date.now())) {
          this.toast.warning('Tu sesion se cerro por inactividad.');
          this.auth.irAlLogin();
        } else {
          // Pulsaste "Salir" en otra pestaña: aqui hacemos lo mismo.
          this.toast.info('Cerraste sesion en otra pestaña.');
          this.auth.irAlInicio();
        }
      }
    });
  }
}
