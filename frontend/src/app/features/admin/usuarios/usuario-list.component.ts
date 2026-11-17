import { Component, ChangeDetectionStrategy, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { Usuario } from '../../../core/models/usuario.model';
import { erroresPorCampo, mensajeDeError } from '../../../core/utils/errores.util';

interface FormUsuario {
  nombres: string;
  correo: string;
  telefono: string;
  direccion: string;
  rol: 'admin' | 'cliente';
  contrasena: string;
  confirmar: string;
}

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-head">
        <label class="filter-label" for="buscar-usuario">Buscar</label>
        <input
          id="buscar-usuario"
          type="search"
          [(ngModel)]="buscar"
          (ngModelChange)="cargar()"
          placeholder="Nombre o correo..."
          class="form-control filter"
        >
      </header>

      @if (loading()) {
        <div class="loading-overlay"><span class="spinner spinner-lg"></span></div>
      } @else if (usuarios().length > 0) {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th class="th-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (u of usuarios(); track u.id) {
                <tr>
                  <td data-label="ID">{{ u.id }}</td>
                  <td data-label="Nombre">
                    <strong>{{ u.nombres }}</strong>
                    @if (u.id === miId()) { <span class="yo">Tú</span> }
                  </td>
                  <td data-label="Correo" class="cell-correo">{{ u.correo }}</td>
                  <td data-label="Rol">
                    <select [ngModel]="u.rol" (ngModelChange)="cambiarRol(u, $event)" class="form-control select-sm"
                      [disabled]="u.id === miId()"
                      [title]="u.id === miId() ? 'No puedes quitarte tu propio rol de administrador' : 'Cambiar rol'">
                      <option value="cliente">Cliente</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td class="actions">
                    <div class="actions-row">
                      <button type="button" class="btn-icon" (click)="abrirEditar(u)" title="Editar" aria-label="Editar usuario">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>
                      </button>
                      @if (u.id !== miId()) {
                        <button type="button" class="btn-icon danger" (click)="eliminar(u)" title="Eliminar" aria-label="Eliminar usuario">
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6.5 7l1 13h9l1-13"/><path d="M10 11v5.5M14 11v5.5"/></svg>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p class="text-center text-muted">No hay usuarios.</p>
      }

      @if (editando(); as u) {
        <div class="modal-backdrop" (click)="cerrarModal()">
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-editar" (click)="$event.stopPropagation()">
            <h2 id="titulo-editar">Editar usuario</h2>
            <p>Cambia los datos de <strong>{{ u.nombres }}</strong>.</p>

            <form #f="ngForm" (ngSubmit)="guardar()" novalidate>
              <div class="form-group">
                <label class="form-label" for="e-nombres">Nombres *</label>
                <input id="e-nombres" name="nombres" class="form-control" [(ngModel)]="form.nombres" maxlength="120" required
                  [class.invalido]="errores()['nombres']">
                @if (errores()['nombres']) { <small class="field-error">{{ errores()['nombres'] }}</small> }
              </div>

              <div class="form-group">
                <label class="form-label" for="e-correo">Correo *</label>
                <input id="e-correo" name="correo" type="email" inputmode="email" class="form-control" [(ngModel)]="form.correo" maxlength="180" required
                  [class.invalido]="errores()['correo']">
                @if (errores()['correo']) { <small class="field-error">{{ errores()['correo'] }}</small> }
              </div>

              <div class="row-2">
                <div class="form-group">
                  <label class="form-label" for="e-telefono">Teléfono</label>
                  <input id="e-telefono" name="telefono" type="tel" inputmode="tel" class="form-control" [(ngModel)]="form.telefono" maxlength="30"
                    [class.invalido]="errores()['telefono']">
                  @if (errores()['telefono']) { <small class="field-error">{{ errores()['telefono'] }}</small> }
                </div>
                <div class="form-group">
                  <label class="form-label" for="e-rol">Rol</label>
                  <select id="e-rol" name="rol" class="form-control" [(ngModel)]="form.rol" [disabled]="u.id === miId()">
                    <option value="cliente">Cliente</option>
                    <option value="admin">Admin</option>
                  </select>
                  @if (u.id === miId()) {
                    <small class="field-hint">No puedes quitarte tu propio rol.</small>
                  } @else if (errores()['rol']) {
                    <small class="field-error">{{ errores()['rol'] }}</small>
                  }
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="e-direccion">Dirección</label>
                <input id="e-direccion" name="direccion" class="form-control" [(ngModel)]="form.direccion" maxlength="255"
                  [class.invalido]="errores()['direccion']">
                @if (errores()['direccion']) { <small class="field-error">{{ errores()['direccion'] }}</small> }
              </div>

              <fieldset class="pass-box">
                <legend>Nueva contraseña <span class="opc">(opcional)</span></legend>
                <p class="field-hint">Déjalo vacío para no cambiarla. Si la cambias, se cerrarán sus sesiones abiertas.</p>
                <div class="row-2">
                  <div class="form-group">
                    <label class="form-label" for="e-pass">Contraseña</label>
                    <input id="e-pass" name="contrasena" type="password" autocomplete="new-password" class="form-control"
                      [(ngModel)]="form.contrasena" [class.invalido]="errores()['contrasena']">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="e-pass2">Confirmar</label>
                    <input id="e-pass2" name="confirmar" type="password" autocomplete="new-password" class="form-control"
                      [(ngModel)]="form.confirmar" [class.invalido]="errores()['contrasena']">
                  </div>
                </div>
                @if (errores()['contrasena']) { <small class="field-error">{{ errores()['contrasena'] }}</small> }
              </fieldset>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="cerrarModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                  @if (guardando()) { <span class="spinner"></span> Guardando... } @else { Guardar cambios }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./usuario-list.component.scss'],
})
export class UsuarioListComponent implements OnInit {
  private usuarioSvc = inject(UsuarioService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  miId = computed(() => this.auth.usuario()?.id ?? null);
  usuarios = signal<Usuario[]>([]);
  editando = signal<Usuario | null>(null);
  guardando = signal(false);
  errores = signal<Record<string, string>>({});
  form: FormUsuario = this.formVacio();
  loading = signal(true);
  buscar = '';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.usuarioSvc.listar({ buscar: this.buscar }).subscribe({
      next: (res: any) => {
        this.usuarios.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  cambiarRol(u: Usuario, rol: 'admin' | 'cliente'): void {
    this.usuarioSvc.actualizar(u.id, { rol }).subscribe({
      next: (res) => {
        this.reemplazar(res.data);
        this.toast.success(`Rol de ${u.nombres} actualizado a "${rol}".`);
      },
      error: (err) => {
        // Recarga la lista para que el selector vuelva al rol real.
        this.cargar();
        this.toast.error(mensajeDeError(err, 'Error al actualizar el rol.'));
      },
    });
  }

  abrirEditar(u: Usuario): void {
    this.form = {
      nombres: u.nombres ?? '',
      correo: u.correo ?? '',
      telefono: u.telefono ?? '',
      direccion: u.direccion ?? '',
      rol: u.rol,
      contrasena: '',
      confirmar: '',
    };
    this.errores.set({});
    this.editando.set(u);
  }

  @HostListener('document:keydown.escape')
  cerrarModal(): void {
    if (this.guardando()) return;
    this.editando.set(null);
    this.form = this.formVacio();
  }

  guardar(): void {
    const u = this.editando();
    if (!u) return;

    const err: Record<string, string> = {};
    if (this.form.nombres.trim().length < 2) err['nombres'] = 'Escribe los nombres (mínimo 2 letras).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.correo.trim())) err['correo'] = 'Escribe un correo válido.';
    if (this.form.contrasena || this.form.confirmar) {
      if (this.form.contrasena.length < 8) err['contrasena'] = 'La contraseña debe tener al menos 8 caracteres.';
      else if (this.form.contrasena !== this.form.confirmar) err['contrasena'] = 'Las contraseñas no coinciden.';
    }
    this.errores.set(err);
    if (Object.keys(err).length) {
      this.toast.error(Object.values(err)[0]);
      return;
    }

    const data: Parameters<UsuarioService['actualizar']>[1] = {
      nombres: this.form.nombres.trim(),
      correo: this.form.correo.trim(),
      telefono: this.form.telefono.trim() || null,
      direccion: this.form.direccion.trim() || null,
    };
    if (u.id !== this.miId()) data.rol = this.form.rol;
    if (this.form.contrasena) {
      data.contrasena = this.form.contrasena;
      data.contrasena_confirmation = this.form.confirmar;
    }

    this.guardando.set(true);
    this.usuarioSvc.actualizar(u.id, data).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.reemplazar(res.data);
        // Si el admin se edito a si mismo, refresca su nombre en el header.
        if (res.data.id === this.miId()) this.auth.actualizarUsuarioLocal(res.data);
        this.toast.success(
          data.contrasena ? `Datos y contraseña de ${res.data.nombres} actualizados.` : `Datos de ${res.data.nombres} actualizados.`,
        );
        this.cerrarModal();
      },
      error: (e) => {
        this.guardando.set(false);
        this.errores.set(erroresPorCampo(e));
        this.toast.error(mensajeDeError(e, 'No se pudo actualizar el usuario.'));
      },
    });
  }

  private reemplazar(actualizado: Usuario): void {
    this.usuarios.update((l) => l.map((x) => (x.id === actualizado.id ? actualizado : x)));
  }

  private formVacio(): FormUsuario {
    return { nombres: '', correo: '', telefono: '', direccion: '', rol: 'cliente', contrasena: '', confirmar: '' };
  }

  eliminar(u: Usuario): void {
    if (!confirm(`Eliminar a "${u.nombres}"?`)) return;
    this.usuarioSvc.eliminar(u.id).subscribe({
      next: () => {
        this.usuarios.update((l) => l.filter((x) => x.id !== u.id));
        this.toast.success('Usuario eliminado.');
      },
      error: (err) => this.toast.error(mensajeDeError(err, 'Error al eliminar.')),
    });
  }
}