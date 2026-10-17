import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        @if (enviado()) {
          <div class="sent-icon">📬</div>
          <h1>Revisa tu correo</h1>
          <p class="text-muted">
            Si existe una cuenta para <strong>{{ correo }}</strong>, enviamos un enlace para
            restablecer tu contrasena. Expira en 60 minutos.
          </p>
          <div class="hint">
            <strong>No llega?</strong> Revisa la carpeta de spam. En entorno de desarrollo el
            "correo" queda registrado en <code>backend/storage/logs/laravel.log</code>.
          </div>
          <div class="actions-row">
            <button type="button" class="btn btn-secondary btn-block" (click)="reenviar()" [disabled]="loading()">
              Reenviar enlace
            </button>
            <a routerLink="/auth/login" class="btn btn-primary btn-block">Volver a ingresar</a>
          </div>
        } @else {
          <h1>Recuperar contrasena</h1>
          <p class="text-muted">Escribe tu correo y te enviamos un enlace para crear una contrasena nueva.</p>

          <form (ngSubmit)="onSubmit()" #f="ngForm">
            <div class="form-group">
              <label class="form-label" for="correo">Correo</label>
              <input
                id="correo"
                name="correo"
                type="email"
                [(ngModel)]="correo"
                required
                email
                class="form-control"
                placeholder="tu@correo.com"
                autocomplete="email"
              >
            </div>

            @if (error()) {
              <div class="alert alert-error">{{ error() }}</div>
            }

            <button type="submit" class="btn btn-primary btn-block" [disabled]="loading() || f.invalid">
              @if (loading()) {
                <span class="spinner"></span> Enviando...
              } @else {
                Enviar enlace de recuperacion
              }
            </button>
          </form>

          <p class="text-center mt-2">
            <a routerLink="/auth/login">← Volver a ingresar</a>
          </p>
        }
      </div>
    </div>
  `,
  styleUrls: ['../auth.shared.scss', './forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  correo = '';
  loading = signal(false);
  error = signal('');
  enviado = signal(false);

  onSubmit(): void {
    this.loading.set(true);
    this.error.set('');

    this.auth.solicitarRecuperacion(this.correo.trim()).subscribe({
      next: () => {
        this.loading.set(false);
        this.enviado.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message ?? 'No pudimos procesar la solicitud.';
        this.error.set(msg);
      },
    });
  }

  reenviar(): void {
    this.enviado.set(false);
    this.onSubmit();
  }
}
