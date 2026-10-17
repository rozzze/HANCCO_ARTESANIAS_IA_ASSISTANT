import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1>Ingresar</h1>
        <p class="text-muted">Accede a tu cuenta para comprar y gestionar pedidos.</p>

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
            >
          </div>

          <div class="form-group">
            <label class="form-label" for="contrasena">Contrasena</label>
            <input
              id="contrasena"
              name="contrasena"
              type="password"
              [(ngModel)]="contrasena"
              required
              minlength="4"
              class="form-control"
              placeholder="••••••••"
            >
          </div>

          <div class="forgot-row">
            <a routerLink="/auth/recuperar">Olvidaste tu contrasena?</a>
          </div>

          @if (error()) {
            <div class="alert alert-error">{{ error() }}</div>
          }

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading() || f.invalid">
            @if (loading()) {
              <span class="spinner"></span> Ingresando...
            } @else {
              Ingresar
            }
          </button>
        </form>

        <p class="text-center mt-2">
          No tienes cuenta? <a routerLink="/auth/register">Registrate</a>
        </p>

        <div class="hint">
          <strong>Cuentas demo:</strong><br>
          Admin: admin&#64;hancco.com / admin1234<br>
          Cliente: cliente&#64;hancco.com / cliente1234
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../auth.shared.scss'],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  correo = '';
  contrasena = '';
  loading = signal(false);
  error = signal('');

  onSubmit(): void {
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.correo, this.contrasena).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success(`Bienvenido, ${res.data.usuario.nombres.split(' ')[0]}`);
        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        if (this.auth.isAdmin()) {
          this.router.navigate([redirect && redirect.startsWith('/admin') ? redirect : '/admin']);
        } else {
          this.router.navigate([redirect ?? '/']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message ?? 'Error al iniciar sesion.';
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }
}