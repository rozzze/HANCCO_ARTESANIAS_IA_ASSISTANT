import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1>Nueva contrasena</h1>
        <p class="text-muted">Crea una contrasena nueva para tu cuenta.</p>

        @if (!token) {
          <div class="alert alert-error">
            El enlace es invalido: falta el codigo de recuperacion. Solicita uno nuevo.
          </div>
          <a routerLink="/auth/recuperar" class="btn btn-primary btn-block">Solicitar enlace</a>
        } @else {
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
                autocomplete="email"
              >
            </div>

            <div class="form-group">
              <label class="form-label" for="password">Nueva contrasena</label>
              <input
                id="password"
                name="password"
                type="password"
                [(ngModel)]="password"
                required
                minlength="8"
                class="form-control"
                placeholder="Minimo 8 caracteres"
                autocomplete="new-password"
              >
              <small class="text-muted">Minimo 8 caracteres.</small>
            </div>

            <div class="form-group">
              <label class="form-label" for="password_confirmation">Confirmar contrasena</label>
              <input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                [(ngModel)]="password_confirmation"
                required
                minlength="8"
                class="form-control"
                placeholder="Repite la contrasena"
                autocomplete="new-password"
              >
              @if (password && password_confirmation && password !== password_confirmation) {
                <small class="form-error">Las contrasenas no coinciden.</small>
              }
            </div>

            @if (error()) {
              <div class="alert alert-error">{{ error() }}</div>
            }

            <button
              type="submit"
              class="btn btn-primary btn-block"
              [disabled]="loading() || f.invalid || password !== password_confirmation"
            >
              @if (loading()) {
                <span class="spinner"></span> Guardando...
              } @else {
                Guardar nueva contrasena
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
  styleUrls: ['../auth.shared.scss'],
})
export class ResetPasswordComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  token = '';
  correo = '';
  password = '';
  password_confirmation = '';
  loading = signal(false);
  error = signal('');

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    this.correo = this.route.snapshot.queryParamMap.get('correo') ?? '';
  }

  onSubmit(): void {
    if (this.password !== this.password_confirmation) {
      this.error.set('Las contrasenas no coinciden.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth
      .restablecerContrasena({
        correo: this.correo.trim(),
        token: this.token,
        password: this.password,
        password_confirmation: this.password_confirmation,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.toast.success(res.message ?? 'Contrasena actualizada.');
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message ?? 'No pudimos restablecer la contrasena.');
        },
      });
  }
}
