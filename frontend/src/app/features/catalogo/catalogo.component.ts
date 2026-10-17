import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService, ProductoFiltros } from '../../core/services/producto.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { Producto } from '../../core/models/producto.model';
import { Categoria } from '../../core/models/categoria.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  template: `
    <div class="container page">
      <header class="page-head">
        <h1>Catalogo</h1>
        <p class="text-muted">{{ total() }} productos</p>
      </header>

      <div class="filters-card">
        <button
          type="button"
          class="filters-toggle"
          (click)="toggleFiltros()"
          [attr.aria-expanded]="filtrosAbiertos()"
          aria-controls="filtros-catalogo"
        >
          <span class="filters-toggle-label">🔎 Filtros</span>
          @if (filtrosActivos() > 0) {
            <span class="filters-count">{{ filtrosActivos() }}</span>
          }
          <span class="filters-caret">{{ filtrosAbiertos() ? '▾' : '▸' }}</span>
        </button>

        <div class="filters-body" id="filtros-catalogo" [class.open]="filtrosAbiertos()">
        <div class="filters">
        <input
          type="search"
          [(ngModel)]="buscar"
          (ngModelChange)="onFiltro()"
          placeholder="Buscar productos..."
          class="form-control filter-search"
        >
        <select [(ngModel)]="categoriaId" (ngModelChange)="onFiltro()" class="form-control">
          <option [ngValue]="undefined">Todas las categorias</option>
          @for (c of categorias(); track c.id) {
            <option [ngValue]="c.id">{{ c.nombre }}</option>
          }
        </select>
        <select [(ngModel)]="material" (ngModelChange)="onFiltro()" class="form-control">
          <option value="">Todos los materiales</option>
          <option value="100% Alpaca">100% Alpaca</option>
          <option value="Alpaca Baby">Alpaca Baby</option>
          <option value="Mezcla Alpaca">Mezcla Alpaca</option>
        </select>
        <select [(ngModel)]="color" (ngModelChange)="onFiltro()" class="form-control">
          <option value="">Todos los colores</option>
          <option value="Marron">Marron</option>
          <option value="Negro">Negro</option>
          <option value="Beige">Beige</option>
          <option value="Blanco">Blanco</option>
          <option value="Gris">Gris</option>
        </select>
        <select [(ngModel)]="talla" (ngModelChange)="onFiltro()" class="form-control">
          <option value="">Todas las tallas</option>
          <option value="XS">XS</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
          <option value="XXL">XXL</option>
          <option value="Unica">Unica</option>
        </select>
        <div class="price-range">
          <input
            type="number"
            min="0"
            step="0.01"
            [(ngModel)]="precioMin"
            (ngModelChange)="onFiltro()"
            placeholder="Precio min"
            class="form-control"
          >
          <span class="range-sep">—</span>
          <input
            type="number"
            min="0"
            step="0.01"
            [(ngModel)]="precioMax"
            (ngModelChange)="onFiltro()"
            placeholder="Precio max"
            class="form-control"
          >
        </div>
        <select [(ngModel)]="ordenar" (ngModelChange)="onFiltro()" class="form-control">
          <option value="recientes">Mas recientes</option>
          <option value="precio_asc">Precio: menor a mayor</option>
          <option value="precio_desc">Precio: mayor a menor</option>
          <option value="nombre">Nombre A-Z</option>
        </select>
        <button class="btn btn-secondary filter-clear" (click)="limpiarFiltros()">Limpiar</button>
        </div>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-overlay"><span class="spinner spinner-lg"></span></div>
      } @else if (productos().length > 0) {
        <div class="grid grid-4">
          @for (prod of productos(); track prod.id) {
            <app-product-card [producto]="prod"></app-product-card>
          }
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
        <p class="text-center text-muted empty">No encontramos productos con esos filtros.</p>
      }
    </div>
  `,
  styleUrls: ['./catalogo.component.scss'],
})
export class CatalogoComponent implements OnInit {
  private productoSvc = inject(ProductoService);
  private categoriaSvc = inject(CategoriaService);

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
  talla = '';
  precioMin?: number;
  precioMax?: number;
  ordenar: ProductoFiltros['ordenar'] = 'recientes';

  filtrosAbiertos = signal(
    typeof window === 'undefined' ? true : !window.matchMedia('(max-width: 768px)').matches
  );

  ngOnInit(): void {
    this.categoriaSvc.listarPublico().subscribe({
      next: (res) => this.categorias.set(res.data ?? []),
      error: () => this.categorias.set([]),
    });
    this.cargar();
  }

  onFiltro(): void {
    this.pagina.set(1);
    this.cargar();
  }

  toggleFiltros(): void {
    this.filtrosAbiertos.update((v) => !v);
  }

  filtrosActivos(): number {
    let n = 0;
    if (this.buscar?.trim()) n++;
    if (this.categoriaId !== undefined && this.categoriaId !== null) n++;
    if (this.material) n++;
    if (this.color) n++;
    if (this.talla) n++;
    if (this.precioMin !== undefined && this.precioMin !== null) n++;
    if (this.precioMax !== undefined && this.precioMax !== null) n++;
    if (this.ordenar !== 'recientes') n++;
    return n;
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
    this.talla = '';
    this.precioMin = undefined;
    this.precioMax = undefined;
    this.ordenar = 'recientes';
    this.pagina.set(1);
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    this.productoSvc
      .listarPublico({
        buscar: this.buscar || undefined,
        categoria_id: this.categoriaId,
        material: this.material || undefined,
        color: this.color || undefined,
        talla: this.talla || undefined,
        precio_min: this.precioMin ?? undefined,
        precio_max: this.precioMax ?? undefined,
        ordenar: this.ordenar,
        page: this.pagina(),
        per_page: 24,
      })
      .subscribe({
        next: (res) => {
          this.productos.set(res.data);
          this.total.set(res.meta?.total ?? 0);
          this.ultimaPagina.set(res.meta?.last_page ?? 1);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
