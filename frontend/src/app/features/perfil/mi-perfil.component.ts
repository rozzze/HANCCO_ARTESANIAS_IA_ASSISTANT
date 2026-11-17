import { Component, ChangeDetectionStrategy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { erroresPorCampo, mensajeDeError } from '../../core/utils/errores.util';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container page">
      <header class="head">
        <div class="avatar" aria-hidden="true">{{ iniciales() }}</div>
        <div>
          <h1>Mi perfil</h1>
          <p>
            {{ usuario()?.correo }}
            <span class="rol" [class.rol-admin]="usuario()?.rol === 'admin'">
              {{ usuario()?.rol === 'admin' ? 'Administrador' : 'Cliente' }}
            </span>
          </p>
        </div>
      </header>

      <div class="grid">
        <!-- === Mis datos === -->
        <section class="card-hv">
          <h2>Mis datos</h2>
          <p class="sub">Así te contactamos y enviamos tus pedidos.</p>

          <form #fDatos="ngForm" (ngSubmit)="guardarDatos(fDatos)" novalidate>
            <div class="form-group">
              <label class="form-label" for="p-nombres">Nombres completos</label>
              <input id="p-nombres" name="nombres" type="text" class="form-control"
                [(ngModel)]="datos.nombres" required minlength="2" maxlength="120"
                autocomplete="name" #nombres="ngModel"
                [class.invalido]="errDatos()['nombres'] || (nombres.invalid && nombres.touched)">
              @if (errDatos()['nombres']) {
                <small class="field-error">{{ errDatos()['nombres'] }}</small>
              } @else if (nombres.invalid && nombres.touched) {
                <small class="field-error">Escribe tus nombres (mínimo 2 letras).</small>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="p-correo">Correo</label>
              <input id="p-correo" name="correo" type="email" class="form-control"
                [(ngModel)]="datos.correo" required email maxlength="180"
                autocomplete="email" inputmode="email" #correo="ngModel"
                [class.invalido]="errDatos()['correo'] || (correo.invalid && correo.touched)">
              @if (errDatos()['correo']) {
                <small class="field-error">{{ errDatos()['correo'] }}</small>
              } @else if (correo.invalid && correo.touched) {
                <small class="field-error">Escribe un correo válido.</small>
              }
            </div>

            <div class="row-2">
              <div class="form-group">
                <label class="form-label" for="p-telefono">Teléfono <span class="opc">(opcional)</span></label>
                <input id="p-telefono" name="telefono" type="tel" class="form-control"
                  [(ngModel)]="datos.telefono" maxlength="30" autocomplete="tel" inputmode="tel"
                  placeholder="Ej: 987 654 321" [class.invalido]="errDatos()['telefono']">
                @if (errDatos()['telefono']) {
                  <small class="field-error">{{ errDatos()['telefono'] }}</small>
                }
              </div>

              <div class="form-group">
                <label class="form-label" for="p-direccion">Dirección <span class="opc">(opcional)</span></label>
                <input id="p-direccion" name="direccion" type="text" class="form-control"
                  [(ngModel)]="datos.direccion" maxlength="255" autocomplete="street-address"
                  placeholder="Calle, número, distrito" [class.invalido]="errDatos()['direccion']">
                @if (errDatos()['direccion']) {
                  <small class="field-error">{{ errDatos()['direccion'] }}</small>
                }
              </div>
            </div>

            <div class="acciones">
              <button type="submit" class="btn btn-primary" [disabled]="guardandoDatos()">
                @if (guardandoDatos()) { <span class="spinner"></span> Guardando... } @else { Guardar cambios }
              </button>
            </div>
          </form>
        </section>

        <!-- === Contrasena === -->
        <section class="card-hv">
          <h2>Cambiar contraseña</h2>
          <p class="sub">Por seguridad, primero escribe la que usas ahora.</p>

          <form #fPass="ngForm" (ngSubmit)="cambiarContrasena(fPass)" novalidate>
            <div class="form-group">
              <label class="form-label" for="p-actual">Contraseña actual</label>
              <input id="p-actual" name="actual" [type]="verPass() ? 'text' : 'password'" class="form-control"
                [(ngModel)]="pass.actual" required autocomplete="current-password"
                [class.invalido]="errPass()['contrasena_actual']">
              @if (errPass()['contrasena_actual']) {
                <small class="field-error">{{ errPass()['contrasena_actual'] }}</small>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="p-nueva">Nueva contraseña</label>
              <input id="p-nueva" name="nueva" [type]="verPass() ? 'text' : 'password'" class="form-control"
                [(ngModel)]="pass.nueva" required minlength="8" autocomplete="new-password"
                [class.invalido]="errPass()['contrasena']">
              @if (errPass()['contrasena']) {
                <small class="field-error">{{ errPass()['contrasena'] }}</small>
              } @else {
                <small class="field-hint">Mínimo 8 caracteres.</small>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="p-confirmar">Confirmar nueva contraseña</label>
              <input id="p-confirmar" name="confirmar" [type]="verPass() ? 'text' : 'password'" class="form-control"
                [(ngModel)]="pass.confirmar" required autocomplete="new-password"
                [class.invalido]="errPass()['confirmar']">
              @if (errPass()['confirmar']) {
                <small class="field-error">{{ errPass()['confirmar'] }}</small>
              }
            </div>

            <label class="check">
              <input type="checkbox" [checked]="verPass()" (change)="verPass.set(!verPass())">
              Mostrar contraseñas
            </label>

            <div class="acciones">
              <button type="submit" class="btn btn-primary" [disabled]="guardandoPass()">
                @if (guardandoPass()) { <span class="spinner"></span> Cambiando... } @else { Cambiar contraseña }
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  `,
  styleUrls: ['./mi-perfil.component.scss'],
})
export class MiPerfilComponent implements OnInit {
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  usuario = this.auth.usuario;
  iniciales = computed(() => {
    const partes = (this.usuario()?.nombres ?? '').trim().split(/\s+/);
    return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || 'H';
  });

  datos = { nombres: '', correo: '', telefono: '', direccion: '' };
  pass = { actual: '', nueva: '', confirmar: '' };

  guardandoDatos = signal(false);
  guardandoPass = signal(false);
  verPass = signal(false);
  errDatos = signal<Record<string, string>>({});
  errPass = signal<Record<string, string>>({});

  ngOnInit(): void {
    this.rellenar();
    // Trae los datos frescos del servidor (por si cambiaron en otro lado).
    this.auth.me().subscribe({
      next: (res) => this.auth.actualizarUsuarioLocal(res.data),
      complete: () => this.rellenar(),
    });
  }

  private rellenar(): void {
    const u = this.usuario();
    if (!u) return;
    this.datos = {
      nombres: u.nombres ?? '',
      correo: u.correo ?? '',
      telefono: u.telefono ?? '',
      direccion: u.direccion ?? '',
    };
  }

  guardarDatos(f: NgForm): void {
    this.errDatos.set({});
    if (f.invalid) {
      f.control.markAllAsTouched();
      this.toast.error('Revisa los campos marcados.');
      return;
    }
    this.guardandoDatos.set(true);
    this.auth
      .actualizarPerfil({
        nombres: this.datos.nombres.trim(),
        correo: this.datos.correo.trim(),
        telefono: this.datos.telefono.trim() || null,
        direccion: this.datos.direccion.trim() || null,
      })
      .subscribe({
        next: (res) => {
          this.guardandoDatos.set(false);
          this.rellenar();
          this.toast.success(res.message);
        },
        error: (err) => {
          this.guardandoDatos.set(false);
          this.errDatos.set(erroresPorCampo(err));
          this.toast.error(mensajeDeError(err, 'No se pudieron guardar tus datos.'));
        },
      });
  }

  cambiarContrasena(f: NgForm): void {
    const err: Record<string, string> = {};
    if (!this.pass.actual) err['contrasena_actual'] = 'Escribe tu contraseña actual.';
    if (this.pass.nueva.length < 8) err['contrasena'] = 'La contraseña debe tener al menos 8 caracteres.';
    if (this.pass.nueva !== this.pass.confirmar) err['confirmar'] = 'Las contraseñas nuevas no coinciden.';
    this.errPass.set(err);
    if (Object.keys(err).length) {
      this.toast.error(Object.values(err)[0]);
      return;
    }

    this.guardandoPass.set(true);
    this.auth
      .cambiarContrasena({
        contrasena_actual: this.pass.actual,
        contrasena: this.pass.nueva,
        contrasena_confirmation: this.pass.confirmar,
      })
      .subscribe({
        next: (res) => {
          this.guardandoPass.set(false);
          this.pass = { actual: '', nueva: '', confirmar: '' };
          f.resetForm();
          this.toast.success(res.message);
        },
        error: (e) => {
          this.guardandoPass.set(false);
          this.errPass.set(erroresPorCampo(e));
          this.toast.error(mensajeDeError(e, 'No se pudo cambiar la contraseña.'));
        },
      });
  }
}
