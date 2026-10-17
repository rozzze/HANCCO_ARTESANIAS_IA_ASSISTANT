import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, Usuario } from '../models/usuario.model';

const TOKEN_KEY = 'hancco_token';
const USER_KEY = 'hancco_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  private readonly _usuario = signal<Usuario | null>(this.cargarUsuario());
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly usuario = this._usuario.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => this._token() !== null);
  readonly isAdmin = computed(() => this._usuario()?.rol === 'admin');

  constructor(private http: HttpClient, private router: Router) {}

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

  logout(redirectTo = '/'): void {
    if (!this.isLoggedIn()) {
      this.limpiarSesion(redirectTo);
      return;
    }
    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
      complete: () => this.limpiarSesion(redirectTo),
      error: () => this.limpiarSesion(redirectTo),
    });
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
    this._token.set(res.data.token);
    this._usuario.set(res.data.usuario);
  }

  private limpiarSesion(redirectTo = '/'): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._usuario.set(null);
    this.router.navigate([redirectTo]);
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