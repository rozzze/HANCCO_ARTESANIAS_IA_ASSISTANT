import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManiquiService, Maniqui, ManiquiDatos } from '../../../core/services/maniqui.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { ToastService } from '../../../core/services/toast.service';
import { Categoria } from '../../../core/models/categoria.model';

@Component({
  selector: 'app-maniqui-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-head">
        <div class="head-left">
          <select [(ngModel)]="filtroCategoria" (ngModelChange)="cargar()" class="form-control filter">
            <option [ngValue]="undefined">Todas las categorias</option>
            @for (c of categorias(); track c.id) {
              <option [ngValue]="c.id">{{ c.nombre }}</option>
            }
          </select>
          <span class="result-count text-muted">{{ maniquies().length }} maniqui(es)</span>
        </div>
        <button class="btn btn-primary" (click)="abrirNuevo()">+ Nuevo maniqui</button>
      </header>

      @if (loading()) {
        <div class="loading-overlay"><span class="spinner spinner-lg"></span></div>
      } @else if (maniquies().length > 0) {
        <div class="maniqui-grid">
          @for (m of maniquies(); track m.id) {
            <div class="maniqui-card" [class.inactiva]="!m.activo">
              <div class="maniqui-img">
                @if (m.url_referencia && !sinImagen().includes(m.id)) {
                  <img [src]="m.url_referencia" [alt]="m.nombre" loading="lazy" (error)="marcarSinImagen(m.id)">
                } @else {
                  <div class="no-img-placeholder">
                    <span>Sin imagen</span>
                    <small>Edita y sube una foto</small>
                  </div>
                }
                @if (!m.activo) {
                  <span class="badge-off">Inactivo</span>
                }
              </div>
              <div class="maniqui-body">
                <strong class="maniqui-nombre">{{ m.nombre }}</strong>
                <span class="maniqui-cat">
                  @if (m.categoria) {
                    <span class="badge badge-cat">{{ m.categoria.nombre }}</span>
                  } @else {
                    <span class="badge badge-gen">General</span>
                  }
                </span>
                @if (m.descripcion) {
                  <p class="maniqui-desc">{{ m.descripcion }}</p>
                }
                <div class="maniqui-actions">
                  <button class="btn btn-secondary btn-sm" (click)="abrirEditar(m)">Editar</button>
                  <button class="btn btn-secondary btn-sm" (click)="toggleActivo(m)">
                    {{ m.activo ? 'Desactivar' : 'Activar' }}
                  </button>
                  <button class="btn btn-danger btn-sm" (click)="eliminar(m)">Eliminar</button>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <p class="text-center text-muted empty">
          No hay maniquies. Sube un maniqui vacio para usarlo con la IA.
        </p>
      }

      @if (modalAbierto()) {
        <div class="modal-backdrop" (click)="cerrarModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>{{ editandoId() ? 'Editar maniqui' : 'Nuevo maniqui' }}</h2>
            <p class="text-muted">Sube la foto del maniqui vacio (sin prenda).</p>

            <div class="form-group">
              <label class="form-label">Imagen del maniqui vacio *</label>
              <div class="upload-row">
                <div class="upload-preview">
                  @if (preview()) {
                    <img [src]="preview()" alt="preview" (error)="preview.set('')">
                  } @else {
                    <span class="no-img">Sin imagen</span>
                  }
                </div>
                <div class="upload-ctl">
                  <input type="file" accept="image/*" #fileInput hidden (change)="onFile($event)">
                  <button type="button" class="btn btn-secondary btn-sm" (click)="fileInput.click()">
                    Elegir imagen
                  </button>
                  <p class="hint">JPG, PNG, WEBP. Max 10MB.</p>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Nombre *</label>
              <input name="nombre" [(ngModel)]="form.nombre" maxlength="120" class="form-control" placeholder="Ej: Mujer adulta">
            </div>

            <div class="form-group">
              <label class="form-label">Categoria</label>
              <select name="categoria_id" [(ngModel)]="form.categoria_id" class="form-control">
                <option [ngValue]="null">General (todas las categorias)</option>
                @for (c of categorias(); track c.id) {
                  <option [ngValue]="c.id">{{ c.nombre }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Descripcion</label>
              <textarea name="descripcion" [(ngModel)]="form.descripcion" rows="2" class="form-control"></textarea>
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

            <div class="modal-actions">
              <button class="btn btn-secondary" (click)="cerrarModal()">Cancelar</button>
              <button class="btn btn-primary" (click)="onSubmit()" [disabled]="guardando()">
                @if (guardando()) {
                  <span class="spinner"></span> Guardando...
                } @else {
                  {{ editandoId() ? 'Actualizar' : 'Crear' }}
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./maniqui-list.component.scss'],
})
export class ManiquiListComponent implements OnInit {
  private maniquiSvc = inject(ManiquiService);
  private categoriaSvc = inject(CategoriaService);
  private toast = inject(ToastService);

  maniquies = signal<Maniqui[]>([]);
  categorias = signal<Categoria[]>([]);
  filtroCategoria = signal<number | undefined>(undefined);
  loading = signal(true);

  modalAbierto = signal(false);
  editandoId = signal<number | null>(null);
  guardando = signal(false);
  error = signal('');
  preview = signal('');
  imagenFile = signal<File | null>(null);
  sinImagen = signal<number[]>([]);

  form = { nombre: '', categoria_id: null as number | null, descripcion: '', activo: true };

  ngOnInit(): void {
    this.categoriaSvc.listarAdmin().subscribe({
      next: (res) => this.categorias.set(res.data ?? []),
      error: () => this.categorias.set([]),
    });
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.maniquiSvc.listarAdmin(this.filtroCategoria()).subscribe({
      next: (res) => {
        this.maniquies.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  marcarSinImagen(id: number): void {
    this.sinImagen.update((list) => (list.includes(id) ? list : [...list, id]));
  }

  abrirNuevo(): void {
    this.editandoId.set(null);
    this.form = { nombre: '', categoria_id: null, descripcion: '', activo: true };
    this.imagenFile.set(null);
    this.preview.set('');
    this.error.set('');
    this.modalAbierto.set(true);
  }

  abrirEditar(m: Maniqui): void {
    this.editandoId.set(m.id);
    this.form = {
      nombre: m.nombre,
      categoria_id: m.categoria_id,
      descripcion: m.descripcion ?? '',
      activo: m.activo,
    };
    this.imagenFile.set(null);
    this.preview.set(m.url_referencia);
    this.error.set('');
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.imagenFile.set(null);
    this.preview.set('');
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.imagenFile.set(file);
    this.preview.set(URL.createObjectURL(file));
  }

  onSubmit(): void {
    if (!this.form.nombre.trim()) {
      this.error.set('El nombre es obligatorio.');
      return;
    }
    if (!this.editandoId() && !this.imagenFile()) {
      this.error.set('Selecciona la imagen del maniqui vacio.');
      return;
    }

    const datos: ManiquiDatos = {
      nombre: this.form.nombre.trim(),
      categoria_id: this.form.categoria_id,
      descripcion: this.form.descripcion,
      activo: this.form.activo,
      imagen: this.imagenFile() ?? undefined,
    };

    this.guardando.set(true);
    this.error.set('');

    const obs = this.editandoId()
      ? this.maniquiSvc.actualizar(this.editandoId()!, datos)
      : this.maniquiSvc.crear(datos);

    obs.subscribe({
      next: () => {
        this.guardando.set(false);
        this.toast.success(this.editandoId() ? 'Maniqui actualizado.' : 'Maniqui creado.');
        this.cerrarModal();
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err.error?.message ?? 'Error al guardar el maniqui.');
      },
    });
  }

  toggleActivo(m: Maniqui): void {
    const datos: ManiquiDatos = {
      nombre: m.nombre,
      categoria_id: m.categoria_id,
      descripcion: m.descripcion ?? '',
      activo: !m.activo,
    };
    this.maniquiSvc.actualizar(m.id, datos).subscribe({
      next: () => {
        this.toast.success(m.activo ? 'Maniqui desactivado.' : 'Maniqui activado.');
        this.cargar();
      },
      error: (err) => this.toast.error(err.error?.message ?? 'Error al cambiar estado.'),
    });
  }

  eliminar(m: Maniqui): void {
    if (!confirm(`Eliminar maniqui "${m.nombre}"?`)) return;
    this.maniquiSvc.eliminar(m.id).subscribe({
      next: () => {
        this.toast.success('Maniqui eliminado.');
        this.cargar();
      },
      error: (err) => this.toast.error(err.error?.message ?? 'Error al eliminar.'),
    });
  }
}
