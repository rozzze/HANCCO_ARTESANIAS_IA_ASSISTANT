import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../core/services/producto.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { Producto } from '../../core/models/producto.model';
import { Categoria } from '../../core/models/categoria.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  template: `
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-content">
          <span class="eyebrow">Artesania Andina</span>
          <h1>Fibra de alpaca<br>tejida con alma</h1>
          <p>
            Prendas unicas hechas a mano por artisansas peruanas. Tradicion, calidad y diseno
            en cada pieza.
          </p>
          <div class="hero-actions">
            <a routerLink="/catalogo" class="btn btn-primary">Ver catalogo</a>
            <a routerLink="/nosotros" class="btn btn-secondary">Nuestra historia</a>
          </div>
        </div>
        <div class="hero-visual"></div>
      </div>
    </section>

    <section class="container page">
      <div class="section-head">
        <h2>Categorias</h2>
        <p class="text-muted">Explora nuestras prendas por tipo</p>
      </div>

      @if (categorias().length > 0) {
        <div class="grid grid-4 categorias">
          @for (cat of categorias(); track cat.id) {
            <a [routerLink]="['/categoria', cat.slug]" class="cat-card">
              <span class="cat-name">{{ cat.nombre }}</span>
              <span class="cat-count">{{ cat.productos_count ?? 0 }} productos</span>
            </a>
          }
        </div>
      }
    </section>

    <section class="container page">
      <div class="section-head">
        <h2>Productos destacados</h2>
        <a routerLink="/catalogo" class="link-more">Ver todo →</a>
      </div>

      @if (loading()) {
        <div class="loading-overlay"><span class="spinner spinner-lg"></span></div>
      } @else if (productos().length > 0) {
        <div class="grid grid-4">
          @for (prod of productos(); track prod.id) {
            <app-product-card [producto]="prod"></app-product-card>
          }
        </div>
      } @else {
        <p class="text-center text-muted">Aun no hay productos.</p>
      }
    </section>

    <section class="cta-strip">
      <div class="container">
        <div class="cta-inner">
          <div>
            <h2>Hecho a mano con fibra de alpaca 100% natural</h2>
            <p>Cada prenda cuenta una historia. Compras directas a artisansas andinas.</p>
          </div>
          <a routerLink="/catalogo" class="btn btn-primary">Explorar</a>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit {
  private productoSvc = inject(ProductoService);
  private categoriaSvc = inject(CategoriaService);

  productos = signal<Producto[]>([]);
  categorias = signal<Categoria[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.categoriaSvc.listarPublico().subscribe({
      next: (res) => this.categorias.set(res.data.filter((c) => c.productos_count ?? 0 > 0)),
    });

    this.productoSvc.listarPublico({ per_page: 8, ordenar: 'recientes' }).subscribe({
      next: (res) => {
        this.productos.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}