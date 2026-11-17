import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, Usuario } from '../models/usuario.model';
import { ToastService } from './toast.service';

const TOKEN_KEY = 'hancco_token';
const USER_KEY = 'hancco_user';
/** Momento (en ms) de la ultima actividad del usuario; lo comparten todas las pestañas. */
export const ACTIVITY_KEY = 'hancco_last_activity';
export const AUTH_STORAGE_KEYS = { token: TOKEN_KEY, user: USER_KEY };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  private readonly _usuario = signal<Usuario | null>(this.cargarUsuario());
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly usuario = this._usuario.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => this._token() !== null);
  readonly isAdmin = computed(() => this._usuario()?.rol === 'admin');

  constructor(
    private http: HttpClient,
    private router: Router,
    private toast: ToastService,
  ) {}

  register(data: {
    nombres: string;
    correo: string;
    contrasena: string;
    contrasena_confirmation: string;
    telefono?: string;
    direccion?: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, data)
      .pipe(tap((res) => this.guardarSesion(res)));
  }

  login(correo: string, contrasena: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, { correo, contrasena })
      .pipe(tap((res) => this.guardarSesion(res)));
  }

  /**
   * Cierra la sesion: borra el token del navegador al instante y luego le
   * avisa al backend para que anule ese token (si falla, no importa).
   */
  logout(redirectTo = '/', queryParams?: Record<string, string>): void {
    const token = this._token();
    this.cerrarSesionLocal(redirectTo, queryParams);
    if (token) {
      this.http
        .post(`${this.apiUrl}/auth/logout`, {}, {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
        })
        .subscribe({ error: () => {} });
    }
  }

  /**
   * Borra la sesion solo en el navegador (sin llamar al backend). Se usa
   * cuando el token ya no sirve: vencio, fue anulado o hubo inactividad.
   */
  cerrarSesionLocal(redirectTo = '/', queryParams?: Record<string, string>): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._usuario.set(null);
    this.router.navigate([redirectTo], { queryParams });
  }

  /**
   * La sesion termino sin que el usuario pulsara "Salir" (inactividad o token
   * vencido): avisa con un toast y lleva al login, recordando la pagina actual
   * para volver a ella despues de ingresar.
   * - revocar = true: ademas avisa al backend para anular el token.
   */
  expirarSesion(mensaje: string, revocar = false): void {
    if (!this.isLoggedIn()) return;
    const queryParams = this.paramsRegreso();
    this.toast.warning(mensaje);
    if (revocar) {
      this.logout('/auth/login', queryParams);
    } else {
      this.cerrarSesionLocal('/auth/login', queryParams);
    }
  }

  /** Lleva al login recordando la pagina actual. */
  irAlLogin(): void {
    this.router.navigate(['/auth/login'], { queryParams: this.paramsRegreso() });
  }

  irAlInicio(): void {
    this.router.navigate(['/']);
  }

  private paramsRegreso(): Record<string, string> | undefined {
    const actual = this.router.url;
    return actual.startsWith('/auth') ? undefined : { redirect: actual };
  }

  /**
   * Otra pestaña inicio o cerro sesion: copiamos ese estado en esta pestaña.
   * Devuelve true si esta pestaña perdio la sesion.
   */
  sincronizarDesdeStorage(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    const teniaSesion = this._token() !== null;
    this._token.set(token);
    this._usuario.set(token ? this.cargarUsuario() : null);
    return teniaSesion && token === null;
  }

  me(): Observable<{ data: Usuario }> {
    return this.http
      .get<{ data: Usuario }>(`${this.apiUrl}/auth/me`)
      .pipe(tap((res) => this._usuario.set(res.data)));
  }

  solicitarRecuperacion(correo: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, { correo });
  }

  restablecerContrasena(data: {
    correo: string;
    token: string;
    password: string;
    password_confirmation: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, data);
  }

  private guardarSesion(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.data.usuario));
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
    this._token.set(res.data.token);
    this._usuario.set(res.data.usuario);
  }

  private cargarUsuario(): Usuario | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as Usuario) : null;
    } catch {
      return null;
    }
  }
}