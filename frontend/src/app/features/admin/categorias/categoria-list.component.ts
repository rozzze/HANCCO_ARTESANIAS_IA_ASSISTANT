import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaService } from '../../../core/services/categoria.service';
import { ToastService } from '../../../core/services/toast.service';
import { Categoria } from '../../../core/models/categoria.model';

@Component({
  selector: 'app-categoria-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="layout">
        <div class="form-card">
          <h3>{{ editandoId ? 'Editar' : 'Nueva' }} categoria</h3>
          <form (ngSubmit)="onSubmit()" #f="ngForm">
            <div class="form-group">
              <label class="form-label">Nombre *</label>
              <input name="nombre" [(ngModel)]="form.nombre" required class="form-control">
            </div>
            <div class="form-group">
              <label class="form-label">Descripcion</label>
              <textarea name="descripcion" [(ngModel)]="form.descripcion" rows="3" class="form-control"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Activo</label>
              <select name="activo" [(ngModel)]="form.activo" class="form-control">
                <option [ngValue]="true">Si</option>
                <option [ngValue]="false">No</option>
              </select>
            </div>
            @if (error()) {
              <div class="alert alert-error">{{ error() }}</div>
            }
            <div class="flex gap-1">
              <button type="submit" class="btn btn-primary" [disabled]="loading() || f.invalid">
                {{ editandoId ? 'Actualizar' : 'Crear' }}
              </button>
              @if (editandoId) {
                <button type="button" class="btn btn-secondary" (click)="cancelar()">Cancelar</button>
              }
            </div>
          </form>
        </div>

        <div class="list-card">
          @if (categorias().length > 0) {
            <table class="data-table">
              <thead>
                <tr><th>Nombre</th><th>Productos</th><th>Activo</th><th></th></tr>
              </thead>
              <tbody>
                @for (c of categorias(); track c.id) {
                  <tr>
                    <td>
                      <strong>{{ c.nombre }}</strong>
                      <span class="meta">/{{ c.slug }}</span>
                    </td>
                    <td>{{ c.productos_count ?? 0 }}</td>
                    <td>
                      <span class="badge" [class.badge-on]="c.activo">{{ c.activo ? 'Si' : 'No' }}</span>
                    </td>
                    <td class="actions">
                      <button class="btn-icon" (click)="editar(c)">✏️</button>
                      <button class="btn-icon danger" (click)="eliminar(c)">🗑️</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="text-center text-muted">No hay categorias.</p>
          }
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./categoria-list.component.scss'],
})
export class CategoriaListComponent implements OnInit {
  private catSvc = inject(CategoriaService);
  private toast = inject(ToastService);

  categorias = signal<Categoria[]>([]);
  loading = signal(false);
  error = signal('');
  editandoId: number | null = null;

  form = { nombre: '', descripcion: '', activo: true };

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.catSvc.listarAdmin().subscribe({
      next: (res) => this.categorias.set(res.data),
    });
  }

  onSubmit(): void {
    this.loading.set(true);
    this.error.set('');

    const obs = this.editandoId
      ? this.catSvc.actualizar(this.editandoId, this.form)
      : this.catSvc.crear(this.form);

    obs.subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success(this.editandoId ? 'Categoria actualizada.' : 'Categoria creada.');
        this.cancelar();
        this.cargar();
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message ?? 'Error al guardar.';
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }

  editar(c: Categoria): void {
    this.editandoId = c.id;
    this.form = { nombre: c.nombre, descripcion: c.descripcion ?? '', activo: c.activo };
  }

  eliminar(c: Categoria): void {
    if (!confirm(`Eliminar "${c.nombre}"?`)) return;
    this.catSvc.eliminar(c.id).subscribe({
      next: () => {
        this.cargar();
        this.toast.success('Categoria eliminada.');
      },
      error: (err) => this.toast.error(err.error?.message ?? 'Error al eliminar.'),
    });
  }

  cancelar(): void {
    this.editandoId = null;
    this.form = { nombre: '', descripcion: '', activo: true };
  }
}