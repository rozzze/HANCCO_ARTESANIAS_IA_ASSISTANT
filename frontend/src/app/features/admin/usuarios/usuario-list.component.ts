import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ToastService } from '../../../core/services/toast.service';
import { Usuario } from '../../../core/models/usuario.model';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (u of usuarios(); track u.id) {
                <tr>
                  <td>{{ u.id }}</td>
                  <td><strong>{{ u.nombres }}</strong></td>
                  <td>{{ u.correo }}</td>
                  <td>
                    <select [ngModel]="u.rol" (ngModelChange)="cambiarRol(u, $event)" class="form-control select-sm">
                      <option value="cliente">Cliente</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <button class="btn-icon danger" (click)="eliminar(u)">🗑️</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p class="text-center text-muted">No hay usuarios.</p>
      }
    </div>
  `,
  styleUrls: ['./usuario-list.component.scss'],
})
export class UsuarioListComponent implements OnInit {
  private usuarioSvc = inject(UsuarioService);
  private toast = inject(ToastService);

  usuarios = signal<Usuario[]>([]);
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
      next: () => {
        u.rol = rol;
        this.toast.success(`Rol de ${u.nombres} actualizado a "${rol}".`);
      },
      error: (err) => this.toast.error(err.error?.message ?? 'Error al actualizar rol.'),
    });
  }

  eliminar(u: Usuario): void {
    if (!confirm(`Eliminar a "${u.nombres}"?`)) return;
    this.usuarioSvc.eliminar(u.id).subscribe({
      next: () => {
        this.usuarios.update((l) => l.filter((x) => x.id !== u.id));
        this.toast.success('Usuario eliminado.');
      },
      error: (err) => this.toast.error(err.error?.message ?? 'Error al eliminar.'),
    });
  }
}