import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  template: `
    <section class="hero">
      <div class="hero-bg" aria-hidden="true"></div>
      <div class="container hero-inner">
        <div class="hero-content">
          <span class="eyebrow fade-1">
            <span class="eyebrow-dot"></span>
            Ropa tradicional &middot; Arequipa
          </span>
          <h1 class="fade-2">Tradicion textil<br><span class="accent-word">de Arequipa</span></h1>
          <p class="fade-3">
            Prendas de vestir tradicional de todo tipo, confeccionadas con telas de calidad.
            A pasos de la Plaza de Armas, llevamos la tradicion arequipena a tu guardarropa.
          </p>
          <div class="hero-actions fade-4">
            <a routerLink="/catalogo" class="btn btn-primary btn-lg">Ver catalogo</a>
            <a routerLink="/nosotros" class="btn btn-secondary btn-lg">Nuestra historia</a>
          </div>
          <p class="hero-location fade-5">
            <span class="loc-pin" aria-hidden="true">&#128205;</span>
            Arequipa, Peru &mdash; a pasos de la Plaza de Armas
          </p>
        </div>

        <div class="hero-visual fade-3" aria-hidden="true">
          <div class="visual-glow"></div>
          <div class="visual-weave"></div>
          <div class="visual-card visual-card-main">
            <span class="vc-label">Nueva coleccion</span>
            <span class="vc-title">Tradicion<br>arequipena</span>
            <span class="vc-line"></span>
            <span class="vc-sub">Calidad en cada prenda</span>
          </div>
          <div class="visual-chip visual-chip-1">
            <span class="chip-icon">&#128085;</span>
            <span>Todo tipo de prendas</span>
          </div>
          <div class="visual-chip visual-chip-2">
            <span class="chip-icon">&#10024;</span>
            <span>Diseno actual</span>
          </div>
        </div>
      </div>
    </section>

    <section class="container section">
      <div class="section-head">
        <div>
          <span class="section-eyebrow">Explora</span>
          <h2>Categorias</h2>
        </div>
        <p class="text-muted">Encuentra la prenda tradicional que buscas</p>
      </div>

      @if (categorias().length > 0) {
        <div class="grid grid-4 categorias">
          @for (cat of categorias(); track cat.id; let i = $index) {
            <a [routerLink]="['/categoria', cat.slug]" class="cat-card">
              <span class="cat-index">{{ i + 1 < 10 ? '0' : '' }}{{ i + 1 }}</span>
              <span class="cat-name">{{ cat.nombre }}</span>
              <span class="cat-count">{{ cat.productos_count ?? 0 }} productos</span>
              <span class="cat-arrow" aria-hidden="true">&rarr;</span>
            </a>
          }
        </div>
      }
    </section>

    <section class="container section">
      <div class="section-head">
        <div>
          <span class="section-eyebrow">Lo mas reciente</span>
          <h2>Productos destacados</h2>
        </div>
        <a routerLink="/catalogo" class="link-more">Ver todo <span aria-hidden="true">&rarr;</span></a>
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
      <div class="cta-glow" aria-hidden="true"></div>
      <div class="container">
        <div class="cta-inner">
          <div>
            <h2>Ropa tradicional de Arequipa, hecha con dedicacion</h2>
            <p>Cada prenda cuenta una historia. Calidad y tradicion en cada pieza.</p>
          </div>
          <a routerLink="/catalogo" class="btn btn-accent btn-lg">Explorar catalogo</a>
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