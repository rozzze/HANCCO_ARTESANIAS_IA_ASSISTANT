import { Component, ChangeDetectionStrategy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../core/services/producto.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { CheckoutService } from '../../core/services/checkout.service';
import { Producto } from '../../core/models/producto.model';
import { Categoria } from '../../core/models/categoria.model';
import { buildSaludoLink } from '../../core/utils/whatsapp.util';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ProductCardComponent, RevealDirective],
  template: `
    <!-- ============ HERO: vitrina del taller ============ -->
    <section class="hero">
      <div class="container">
        <div class="hero-panel">
          <div class="hero-copy">
            <h1 class="hero-title">Tradicion textil<br><em>de Arequipa</em></h1>
            <p class="hero-lead">
              Prendas de vestir tradicional de todo tipo, confeccionadas con telas de calidad.
              A pasos de la Plaza de Armas, llevamos la tradicion arequipena a tu guardarropa.
            </p>

            <div class="hero-actions">
              <a routerLink="/catalogo" class="btn btn-lg btn-terra">
                Ver catalogo
                <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </a>
              @if (waLink()) {
                <a [href]="waLink()" target="_blank" rel="noopener noreferrer" class="btn btn-lg btn-cream-ghost">
                  <svg class="ico ico-wa" viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="waPath"/></svg>
                  Escribenos por WhatsApp
                </a>
              }
            </div>

            <p class="hero-location">
              <svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>
              </svg>
              Arequipa, Peru &mdash; a pasos de la Plaza de Armas
            </p>
          </div>

          <div class="hero-stage">
            <div class="arch-ghost" aria-hidden="true"></div>
            <!-- El arco siempre existe (no se reemplaza al llegar los datos), asi no se anima dos veces -->
            <div class="arch" [class.is-loaded]="fotoLista()">
              <span class="arch-window">
                @if (destacado(); as p) {
                  <a [routerLink]="['/producto', p.id]" class="arch-link" [attr.aria-label]="'Ver ' + p.nombre">
                    <img class="arch-backdrop" [src]="p.imagen_principal_url" alt="" aria-hidden="true" decoding="async">
                    <img class="arch-photo" [src]="p.imagen_principal_url" [alt]="p.nombre" decoding="async"
                         fetchpriority="high" (load)="fotoLista.set(true)" (error)="fotoLista.set(true)">
                  </a>
                }
              </span>
            </div>
            @if (destacado(); as p) {
              @if (esFotoIA(p)) {
                <span class="arch-ia">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/></svg>
                  Vista en maniqui con IA
                </span>
              }
              <a [routerLink]="['/producto', p.id]" class="arch-tag">
                <span class="arch-tag-cat">{{ p.categoria?.nombre ?? 'Nuevo' }}</span>
                <span class="arch-tag-name">{{ p.nombre | titlecase }}</span>
                <span class="arch-tag-price">S/ {{ p.precio_venta | number:'1.2-2' }}</span>
              </a>
            }
          </div>
        </div>
      </div>
    </section>

    <!-- ============ COMO NACE TU PRENDA ============ -->
    <section class="section proceso">
      <div class="container">
      <h2 class="section-title" appReveal>Como nace tu prenda</h2>

      <ol class="thread" appReveal [revealDelay]="80">
        <li class="thread-step">
          <span class="knot" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M4 20c4-1 6-4 8-8s4-7 8-8"/><path d="M15 4l5 0 0 5"/><circle cx="7" cy="17" r="1.6"/></svg>
          </span>
          <h3>Hecha a mano</h3>
          <p>Cada prenda se confecciona a mano en Arequipa, a pasos de la Plaza de Armas.</p>
        </li>
        <li class="thread-step">
          <span class="knot" aria-hidden="true">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="4.5" r="1.8"/><path d="M12 6.3V8M7 8h10l-1.5 7h-7L7 8zM12 15v6M9 21h6"/></svg>
          </span>
          <h3>La ves puesta</h3>
          <p>Fotografiamos cada prenda en maniqui con ayuda de IA, para que veas como luce antes de pedirla.</p>
        </li>
        <li class="thread-step">
          <span class="knot" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path [attr.d]="waPath"/></svg>
          </span>
          <h3>Consultas por WhatsApp</h3>
          <p>Te respondemos tallas, colores y disponibilidad directamente, sin formularios.</p>
        </li>
      </ol>
      </div>
    </section>

    <!-- ============ PRODUCTOS ============ -->
    <section class="section productos">
      <div class="container">
        <div class="productos-head" appReveal>
          <h2 class="section-title">Productos destacados</h2>
          <a routerLink="/catalogo" class="link-more">
            Ver todo
            <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
        </div>

        @if (categorias().length > 0) {
          <nav class="cat-pills" aria-label="Categorias" appReveal [revealDelay]="60">
            @for (cat of categorias(); track cat.id) {
              <a [routerLink]="['/categoria', cat.slug]" class="cat-pill">
                {{ cat.nombre }}
                <span class="cat-pill-count">{{ cat.productos_count ?? 0 }}</span>
              </a>
            }
          </nav>
        }
      </div>

      <div class="container track-wrap">
        @if (loading()) {
          <div class="track" aria-busy="true">
            @for (s of [1, 2, 3]; track s) {
              <div class="skeleton-card" aria-hidden="true"></div>
            }
          </div>
        } @else if (productos().length > 0) {
          <div class="track">
            @for (prod of productos(); track prod.id; let i = $index) {
              <div class="track-item" appReveal [revealDelay]="i < 4 ? i * 70 : 0">
                <app-product-card [producto]="prod"></app-product-card>
              </div>
            }
            <a routerLink="/catalogo" class="track-item more-tile" appReveal [revealDelay]="productos().length < 4 ? productos().length * 70 : 0">
              <span class="more-arch" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </span>
              <span class="more-title">Ver todo el catalogo</span>
              <span class="more-sub">Filtra por categoria, talla y color</span>
            </a>
          </div>
        } @else {
          <p class="empty">Aun no hay productos. Escribenos por WhatsApp y te contamos que tenemos en el taller.</p>
        }
      </div>
    </section>

    <!-- ============ CTA FINAL ============ -->
    <section class="cta">
      <div class="container">
        <div class="cta-panel" appReveal>
          <div class="cta-copy">
            <h2>Ropa tradicional de Arequipa, hecha con dedicacion</h2>
            <p>Cada prenda cuenta una historia. Calidad y tradicion en cada pieza.</p>
          </div>
          <div class="cta-actions">
            @if (waLink()) {
              <a [href]="waLink()" target="_blank" rel="noopener noreferrer" class="btn btn-lg btn-cream">
                <svg class="ico ico-wa" viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="waPath"/></svg>
                Escribenos por WhatsApp
              </a>
            }
            <a routerLink="/catalogo" class="btn btn-lg btn-cream-ghost">Explorar catalogo</a>
            <a routerLink="/nosotros" class="cta-link">Nuestra historia</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit {
  private productoSvc = inject(ProductoService);
  private categoriaSvc = inject(CategoriaService);
  private checkoutSvc = inject(CheckoutService);

  productos = signal<Producto[]>([]);
  categorias = signal<Categoria[]>([]);
  loading = signal(true);

  /** True cuando la foto del arco termino de descargarse (para mostrarla suave, una sola vez). */
  fotoLista = signal(false);

  /** Prenda que se muestra en el arco del hero: la mas reciente con foto. */
  destacado = computed(() => this.productos().find((p) => !!p.imagen_principal_url) ?? null);

  /** Link general de WhatsApp (vacio si la tienda aun no configuro su numero). */
  waLink = computed(() => buildSaludoLink(this.checkoutSvc.config()?.whatsapp_tienda ?? ''));

  /** Icono de WhatsApp (trazo simple, mismo grosor que el resto de iconos). */
  readonly waPath =
    'M4 20l1.3-3.9A8 8 0 1 1 8 19.1L4 20zM9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 1a5 5 0 0 1-2.9-2.9l1-1-1-2L9 8.5z';

  ngOnInit(): void {
    if (!this.checkoutSvc.config()) {
      this.checkoutSvc.obtenerConfig().subscribe({ error: () => {} });
    }

    this.categoriaSvc.listarPublico().subscribe({
      next: (res) => this.categorias.set(res.data.filter((c) => (c.productos_count ?? 0) > 0)),
    });

    this.productoSvc.listarPublico({ per_page: 8, ordenar: 'recientes' }).subscribe({
      next: (res) => {
        this.productos.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** True si la foto principal fue generada con IA (prenda en maniqui). */
  esFotoIA(p: Producto): boolean {
    const principal = p.imagenes?.find((i) => i.es_principal) ?? p.imagenes?.[0];
    return !!principal?.generada_ia;
  }
}
