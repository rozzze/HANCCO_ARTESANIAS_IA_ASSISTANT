import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1>Crear cuenta</h1>
        <p class="text-muted">Registrate para comprar y gestionar tus pedidos.</p>

        <form (ngSubmit)="onSubmit()" #f="ngForm">
          <div class="form-group">
            <label class="form-label" for="nombres">Nombres completos</label>
            <input id="nombres" name="nombres" type="text" [(ngModel)]="nombres" required minlength="2" class="form-control">
          </div>

          <div class="form-group">
            <label class="form-label" for="correo">Correo</label>
            <input id="correo" name="correo" type="email" [(ngModel)]="correo" required email class="form-control">
          </div>

          <div class="form-group">
            <label class="form-label" for="contrasena">Contrasena</label>
            <input id="contrasena" name="contrasena" type="password" [(ngModel)]="contrasena" required minlength="8" class="form-control">
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmar">Confirmar contrasena</label>
            <input id="confirmar" name="confirmar" type="password" [(ngModel)]="confirmar" required minlength="8" class="form-control">
          </div>

          @if (error()) {
            <div class="alert alert-error">{{ error() }}</div>
          }

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading() || f.invalid">
            @if (loading()) {
              <span class="spinner"></span> Creando cuenta...
            } @else {
              Crear cuenta
            }
          </button>
        </form>

        <p class="text-center mt-2">
          Ya tienes cuenta? <a routerLink="/auth/login">Ingresar</a>
        </p>
      </div>
    </div>
  `,
  styleUrls: ['../auth.shared.scss'],
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  nombres = '';
  correo = '';
  contrasena = '';
  confirmar = '';
  loading = signal(false);
  error = signal('');

  onSubmit(): void {
    if (this.contrasena !== this.confirmar) {
      this.error.set('Las contrasenas no coinciden.');
      this.toast.error('Las contrasenas no coinciden.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth
      .register({
        nombres: this.nombres,
        correo: this.correo,
        contrasena: this.contrasena,
        contrasena_confirmation: this.contrasena,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.toast.success(`Cuenta creada. Bienvenido, ${res.data.usuario.nombres.split(' ')[0]}`);
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.loading.set(false);
          const msg = this.mensajeDeError(err);
          this.error.set(msg);
          this.toast.error(msg);
        },
      });
  }

  private mensajeDeError(err: any): string {
    const campos = err?.error?.errors as Record<string, string[]> | undefined;
    if (campos) {
      const detalle = String(Object.values(campos)[0]?.[0] ?? '');
      if (detalle.includes('already been taken')) return 'Ese correo ya esta registrado.';
      if (detalle.includes('must be at least')) return 'La contrasena debe tener al menos 8 caracteres.';
      if (detalle.includes('valid email')) return 'El correo no tiene un formato valido.';
      if (detalle.includes('required')) return 'Completa todos los campos obligatorios.';
      if (detalle.includes('confirmation')) return 'Las contrasenas no coinciden.';
      if (detalle) return detalle;
    }
    return err?.error?.message ?? 'Error al crear cuenta.';
  }
}