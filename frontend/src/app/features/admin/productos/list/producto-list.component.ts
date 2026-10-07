import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductoService, ProductoAdminFiltros, ProductoAdminOrdenar } from '../../../../core/services/producto.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Producto } from '../../../../core/models/producto.model';
import { Categoria } from '../../../../core/models/categoria.model';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <header class="page-head">
        <span class="result-count text-muted">{{ total() }} producto(s)</span>
        <a routerLink="/admin/productos/nuevo" class="btn btn-primary">+ Nuevo producto</a>
      </header>

      <div class="filters-card">
        <div class="filters-grid">
          <div class="filter-field filter-search">
            <label for="f-buscar">Buscar</label>
            <input
              id="f-buscar"
              type="search"
              [(ngModel)]="buscar"
              (ngModelChange)="onFiltro()"
              placeholder="Nombre, slug, material, color..."
              class="form-control"
            >
          </div>

          <div class="filter-field">
            <label for="f-categoria">Categoria</label>
            <select id="f-categoria" [(ngModel)]="categoriaId" (ngModelChange)="onFiltro()" class="form-control">
              <option [ngValue]="undefined">Todas</option>
              @for (c of categorias(); track c.id) {
                <option [ngValue]="c.id">{{ c.nombre }}</option>
              }
            </select>
          </div>

          <div class="filter-field">
            <label for="f-material">Material</label>
            <select id="f-material" [(ngModel)]="material" (ngModelChange)="onFiltro()" class="form-control">
              <option value="">Todos</option>
              <option value="100% Alpaca">100% Alpaca</option>
              <option value="Alpaca Baby">Alpaca Baby</option>
              <option value="Mezcla Alpaca">Mezcla Alpaca</option>
            </select>
          </div>

          <div class="filter-field">
            <label for="f-color">Color</label>
            <select id="f-color" [(ngModel)]="color" (ngModelChange)="onFiltro()" class="form-control">
              <option value="">Todos</option>
              <option value="Marron">Marron</option>
              <option value="Negro">Negro</option>
              <option value="Beige">Beige</option>
              <option value="Blanco">Blanco</option>
              <option value="Gris">Gris</option>
            </select>
          </div>

          <div class="filter-field">
            <label for="f-estado">Estado</label>
            <select id="f-estado" [(ngModel)]="estado" (ngModelChange)="onFiltro()" class="form-control">
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          <div class="filter-field">
            <label for="f-stock">Stock &le; a</label>
            <input
              id="f-stock"
              type="number"
              min="0"
              [(ngModel)]="stockBajo"
              (ngModelChange)="onFiltro()"
              placeholder="Ej: 5"
              class="form-control"
            >
          </div>

          <div class="filter-field">
            <label for="f-precio-min">Precio min</label>
            <input
              id="f-precio-min"
              type="number"
              min="0"
              step="0.01"
              [(ngModel)]="precioMin"
              (ngModelChange)="onFiltro()"
              placeholder="0.00"
              class="form-control"
            >
          </div>

          <div class="filter-field">
            <label for="f-precio-max">Precio max</label>
            <input
              id="f-precio-max"
              type="number"
              min="0"
              step="0.01"
              [(ngModel)]="precioMax"
              (ngModelChange)="onFiltro()"
              placeholder="0.00"
              class="form-control"
            >
          </div>

          <div class="filter-field">
            <label for="f-ordenar">Ordenar</label>
            <select id="f-ordenar" [(ngModel)]="ordenar" (ngModelChange)="onFiltro()" class="form-control">
              <option value="recientes">Mas recientes</option>
              <option value="nombre">Nombre A-Z</option>
              <option value="precio_asc">Precio: menor a mayor</option>
              <option value="precio_desc">Precio: mayor a menor</option>
              <option value="stock_asc">Stock: menor a mayor</option>
              <option value="stock_desc">Stock: mayor a menor</option>
            </select>
          </div>

          <div class="filter-field filter-actions">
            <button class="btn btn-secondary" (click)="limpiarFiltros()">Limpiar</button>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-overlay"><span class="spinner spinner-lg"></span></div>
      } @else if (productos().length > 0) {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th></th>
                <th>Nombre</th>
                <th>Categoria</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (p of productos(); track p.id) {
                <tr>
                  <td class="img-cell">
                    @if (p.imagen_principal_url) {
                      <img [src]="p.imagen_principal_url" [alt]="p.nombre">
                    } @else {
                      <div class="no-img">Sin img</div>
                    }
                  </td>
                  <td>
                    <strong>{{ p.nombre }}</strong>
                    <span class="meta">{{ p.material }} · {{ p.color }}</span>
                    <span class="talla-chips">
                      @for (t of p.tallas ?? []; track t.id) {
                        <span class="talla-chip" [class.sin-stock]="t.stock_disponible === 0" [title]="'Stock talla ' + t.talla + ': ' + t.stock_disponible">
                          {{ t.talla }}<small>{{ t.stock_disponible }}</small>
                        </span>
                      }
                    </span>
                  </td>
                  <td>{{ p.categoria?.nombre ?? '—' }}</td>
                  <td>S/ {{ p.precio_venta | number:'1.2-2' }}</td>
                  <td>
                    <span [class.stock-low]="p.stock_disponible <= 3">
                      {{ p.stock_disponible }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [class.badge-on]="p.activo">
                      {{ p.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="actions">
                    <a [routerLink]="['/admin/productos', p.id, 'imagenes']" class="btn-icon" title="Imagenes">🖼️</a>
                    <a [routerLink]="['/admin/productos', p.id, 'editar']" class="btn-icon" title="Editar">✏️</a>
                    <button class="btn-icon danger" (click)="eliminar(p)" title="Eliminar">🗑️</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (ultimaPagina() > 1) {
          <nav class="pagination">
            <button class="btn btn-secondary" [disabled]="pagina() === 1" (click)="cambiarPagina(pagina() - 1)">
              ← Anterior
            </button>
            <span class="page-info">Pagina {{ pagina() }} de {{ ultimaPagina() }}</span>
            <button class="btn btn-secondary" [disabled]="pagina() === ultimaPagina()" (click)="cambiarPagina(pagina() + 1)">
              Siguiente →
            </button>
          </nav>
        }
      } @else {
        <p class="text-center text-muted empty">No hay productos con esos filtros. <a routerLink="/admin/productos/nuevo">Crear nuevo</a>.</p>
      }
    </div>
  `,
  styleUrls: ['./producto-list.component.scss'],
})
export class ProductoListComponent implements OnInit {
  private productoSvc = inject(ProductoService);
  private categoriaSvc = inject(CategoriaService);
  private toast = inject(ToastService);

  productos = signal<Producto[]>([]);
  categorias = signal<Categoria[]>([]);
  loading = signal(true);
  total = signal(0);
  pagina = signal(1);
  ultimaPagina = signal(1);

  buscar = '';
  categoriaId?: number;
  material = '';
  color = '';
  estado: '' | 'activo' | 'inactivo' = '';
  stockBajo?: number;
  precioMin?: number;
  precioMax?: number;
  ordenar: ProductoAdminOrdenar = 'recientes';

  ngOnInit(): void {
    this.categoriaSvc.listarAdmin().subscribe({
      next: (res) => this.categorias.set(res.data ?? []),
      error: () => this.categorias.set([]),
    });
    this.cargar();
  }

  onFiltro(): void {
    this.pagina.set(1);
    this.cargar();
  }

  cambiarPagina(p: number): void {
    this.pagina.set(p);
    this.cargar();
  }

  limpiarFiltros(): void {
    this.buscar = '';
    this.categoriaId = undefined;
    this.material = '';
    this.color = '';
    this.estado = '';
    this.stockBajo = undefined;
    this.precioMin = undefined;
    this.precioMax = undefined;
    this.ordenar = 'recientes';
    this.pagina.set(1);
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    const filtros: ProductoAdminFiltros = {
      per_page: 24,
      page: this.pagina(),
      ordenar: this.ordenar,
    };
    if (this.buscar) filtros.buscar = this.buscar;
    if (this.categoriaId !== undefined) filtros.categoria_id = this.categoriaId;
    if (this.material) filtros.material = this.material;
    if (this.color) filtros.color = this.color;
    if (this.estado === 'activo') filtros.activo = true;
    if (this.estado === 'inactivo') filtros.activo = false;
    if (this.stockBajo !== undefined && this.stockBajo !== null) filtros.stock_bajo = this.stockBajo;
    if (this.precioMin !== undefined && this.precioMin !== null) filtros.precio_min = this.precioMin;
    if (this.precioMax !== undefined && this.precioMax !== null) filtros.precio_max = this.precioMax;

    this.productoSvc.listarAdmin(filtros).subscribe({
      next: (res) => {
        this.productos.set(res.data);
        this.total.set(res.meta?.total ?? res.data.length);
        this.ultimaPagina.set(res.meta?.last_page ?? 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  eliminar(p: Producto): void {
    if (!confirm(`Eliminar "${p.nombre}"?`)) return;
    this.productoSvc.eliminar(p.id).subscribe({
      next: () => {
        this.productos.update((list) => list.filter((x) => x.id !== p.id));
        this.toast.success('Producto eliminado.');
        if (this.productos().length === 0 && this.pagina() > 1) {
          this.cambiarPagina(this.pagina() - 1);
        } else {
          this.cargar();
        }
      },
      error: (err) => this.toast.error(err.error?.message ?? 'Error al eliminar.'),
    });
  }
}
