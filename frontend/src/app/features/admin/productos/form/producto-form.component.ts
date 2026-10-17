import { Component, ChangeDetectionStrategy, OnInit, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductoService } from '../../../../core/services/producto.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Categoria } from '../../../../core/models/categoria.model';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/admin/productos" class="back-link">← Productos</a>

      <form (ngSubmit)="onSubmit()" #f="ngForm" class="form-grid">
        <div class="form-group">
          <label class="form-label">Categoria *</label>
          <select name="categoria_id" [(ngModel)]="form.categoria_id" required class="form-control">
            <option [ngValue]="0" disabled>Seleccionar...</option>
            @for (c of categorias(); track c.id) {
              <option [ngValue]="c.id">{{ c.nombre }}</option>
            }
          </select>
        </div>

        <div class="form-group full">
          <label class="form-label">Nombre *</label>
          <input name="nombre" [(ngModel)]="form.nombre" required maxlength="180" class="form-control">
        </div>

        <div class="form-group">
          <label class="form-label">Material *</label>
          <input name="material" [(ngModel)]="form.material" required class="form-control" placeholder="Algodon, lana, mezcla...">
        </div>

        <div class="form-group">
          <label class="form-label">Color *</label>
          <input name="color" [(ngModel)]="form.color" required class="form-control">
        </div>

        <div class="form-group">
          <label class="form-label">Precio venta (S/) *</label>
          <input name="precio_venta" [(ngModel)]="form.precio_venta" required type="number" step="0.01" min="0" class="form-control">
        </div>

        <div class="form-group full">
          <label class="form-label">Tallas y stock *</label>
          <p class="text-muted mb-1">Marca las tallas disponibles e indica el stock de cada una.</p>
          <div class="tallas-grid">
            @for (t of TALLAS; track t) {
              <div class="talla-row" [class.activa]="entradaDe(t) !== null">
                <label class="talla-check">
                  <input type="checkbox" [checked]="entradaDe(t) !== null" (change)="toggleTalla(t)">
                  <span class="talla-pill">{{ t }}</span>
                </label>
                @if (entradaDe(t); as entrada) {
                  <input
                    type="number"
                    min="0"
                    class="form-control talla-stock"
                    [name]="'stock_' + t"
                    [(ngModel)]="entrada.stock_disponible"
                    [ngModelOptions]="{ standalone: true }"
                    placeholder="Stock"
                  >
                  <span class="talla-unidades">uds.</span>
                }
              </div>
            }
          </div>
          @if (form.tallas.length === 0) {
            <div class="form-error">Selecciona al menos una talla con su stock.</div>
          }
        </div>

        <div class="form-group">
          <label class="form-label">Activo</label>
          <select name="activo" [(ngModel)]="form.activo" class="form-control">
            <option [ngValue]="true">Si</option>
            <option [ngValue]="false">No</option>
          </select>
        </div>

        <div class="form-group full">
          <label class="form-label">Descripcion manual</label>
          <textarea name="descripcion_manual" [(ngModel)]="form.descripcion_manual" rows="4" class="form-control"></textarea>
        </div>

        <div class="form-group full">
          <div class="desc-ia-head">
            <label class="form-label">Descripcion IA</label>
            @if (id) {
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                (click)="generarDescripcionConIa()"
                [disabled]="generandoDesc() || !tieneImagenPrincipal()"
                [title]="tieneImagenPrincipal() ? 'Genera una descripcion desde la imagen principal' : 'Sube y marca una imagen como principal primero'"
              >
                @if (generandoDesc()) {
                  <span class="spinner"></span> Generando...
                } @else {
                  ✨ Generar con IA
                }
              </button>
            }
          </div>
          @if (id && !tieneImagenPrincipal()) {
            <p class="ia-hint text-muted">
              Sin imagen principal. <a [routerLink]="['/admin/productos', id, 'imagenes']">Gestionar imagenes</a> para marcar una.
            </p>
          }
          <textarea name="descripcion_ia" [(ngModel)]="form.descripcion_ia" rows="4" class="form-control" placeholder="Pulsa Generar con IA o escribela tu..."></textarea>
        </div>

        @if (error()) {
          <div class="alert alert-error full">{{ error() }}</div>
        }
        @if (mensaje()) {
          <div class="alert alert-success full">{{ mensaje() }}</div>
        }

        <div class="form-actions full">
          @if (id) {
            <a [routerLink]="['/admin/productos', id, 'imagenes']" class="btn btn-secondary">Gestionar imagenes →</a>
          }
          <button type="submit" class="btn btn-primary" [disabled]="loading() || f.invalid || form.tallas.length === 0">
            @if (loading()) {
              <span class="spinner"></span> Guardando...
            } @else {
              {{ id ? 'Actualizar' : 'Crear' }} producto
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./producto-form.component.scss'],
})
export class ProductoFormComponent implements OnInit {
  private productoSvc = inject(ProductoService);
  private categoriaSvc = inject(CategoriaService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @Input() id?: string;

  categorias = signal<Categoria[]>([]);
  loading = signal(false);
  error = signal('');
  mensaje = signal('');
  generandoDesc = signal(false);
  tieneImagenPrincipal = signal(false);

  readonly TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Unica'];

  form: {
    categoria_id: number;
    nombre: string;
    material: string;
    color: string;
    precio_venta: number;
    descripcion_manual: string;
    descripcion_ia: string;
    activo: boolean;
    tallas: { talla: string; stock_disponible: number }[];
  } = {
    categoria_id: 0,
    nombre: '',
    material: '',
    color: '',
    precio_venta: 0,
    descripcion_manual: '',
    descripcion_ia: '',
    activo: true,
    tallas: [],
  };

  entradaDe(talla: string): { talla: string; stock_disponible: number } | null {
    return this.form.tallas.find((t) => t.talla === talla) ?? null;
  }

  toggleTalla(talla: string): void {
    const existente = this.entradaDe(talla);
    if (existente) {
      this.form.tallas = this.form.tallas.filter((t) => t.talla !== talla);
    } else {
      this.form.tallas = [
        ...this.form.tallas,
        { talla, stock_disponible: 0 },
      ].sort((a, b) => this.TALLAS.indexOf(a.talla) - this.TALLAS.indexOf(b.talla));
    }
  }

  ngOnInit(): void {
    this.categoriaSvc.listarAdmin().subscribe({
      next: (res) => this.categorias.set(res.data),
    });

    if (this.id) {
      this.productoSvc.obtenerAdmin(Number(this.id)).subscribe({
        next: (res) => {
          const p = res.data;
          this.form = {
            categoria_id: p.categoria_id,
            nombre: p.nombre,
            material: p.material,
            color: p.color,
            precio_venta: p.precio_venta,
            descripcion_manual: p.descripcion_manual ?? '',
            descripcion_ia: p.descripcion_ia ?? '',
            activo: p.activo,
            tallas: (p.tallas ?? []).map((t) => ({
              talla: t.talla,
              stock_disponible: t.stock_disponible,
            })),
          };
          this.tieneImagenPrincipal.set((p.imagenes ?? []).some((i) => i.es_principal));
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.tallas.length === 0) {
      this.error.set('Selecciona al menos una talla con su stock.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.mensaje.set('');

    const obs = this.id
      ? this.productoSvc.actualizar(Number(this.id), this.form)
      : this.productoSvc.crear(this.form);

    obs.subscribe({
      next: (res) => {
        this.loading.set(false);
        this.mensaje.set('Producto guardado.');
        this.toast.success('Producto guardado.');
        if (!this.id) {
          this.router.navigate(['/admin/productos', res.data.id, 'imagenes']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message ?? 'Error al guardar.';
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }

  generarDescripcionConIa(): void {
    if (!this.id) return;

    this.generandoDesc.set(true);
    this.error.set('');

    this.productoSvc.generarDescripcion(Number(this.id)).subscribe({
      next: (res) => {
        this.generandoDesc.set(false);
        this.form = { ...this.form, descripcion_ia: res.data.descripcion };
        this.toast.success('Descripcion generada. Revisala y guarda el producto.');
      },
      error: (err) => {
        this.generandoDesc.set(false);
        const msg = err.error?.detalle ?? err.error?.message ?? 'Error al generar la descripcion.';
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }
}