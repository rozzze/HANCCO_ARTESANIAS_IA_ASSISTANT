import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductoService } from '../../core/services/producto.service';
import { CarritoService } from '../../core/services/carrito.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CheckoutService } from '../../core/services/checkout.service';
import { buildConsultaLink } from '../../core/utils/whatsapp.util';
import { Producto, ProductoTalla, Imagen } from '../../core/models/producto.model';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container page">
      @if (loading()) {
        <div class="loading-overlay"><span class="spinner spinner-lg"></span></div>
      } @else {
        <a routerLink="/catalogo" class="back-link">← Volver al catalogo</a>
        @if (producto(); as p) {
          <div class="detail">
            <div class="gallery">
              @if (imagenActiva(); as img) {
                <div class="main-img">
                  <img class="main-img__backdrop" [src]="img.url_cloudflare_s3" alt="" aria-hidden="true" decoding="async">
                  <img class="main-img__photo" [src]="img.url_cloudflare_s3" [alt]="p.nombre" fetchpriority="high" decoding="async">

                  @if (img.generada_ia) {
                    <span class="badge-ia">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/></svg>
                      Mejorada con IA
                    </span>
                  }

                  @if (imagenes().length > 1) {
                    <button type="button" class="nav-btn nav-btn--prev" (click)="mover(-1)" aria-label="Foto anterior">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                    <button type="button" class="nav-btn nav-btn--next" (click)="mover(1)" aria-label="Foto siguiente">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
                    </button>
                    <span class="counter" aria-live="polite">{{ indiceActivo() + 1 }} / {{ imagenes().length }}</span>
                  }
                </div>
              } @else {
                <div class="main-img no-image">Sin imagen disponible</div>
              }

              @if (imagenes().length > 1) {
                <div class="thumbs">
                  @for (img of imagenes(); track img.id; let i = $index) {
                    <button
                      type="button"
                      class="thumb-btn"
                      [class.active]="imagenActiva()?.id === img.id"
                      [attr.aria-current]="imagenActiva()?.id === img.id ? 'true' : null"
                      [attr.aria-label]="'Ver foto ' + (i + 1) + ' de ' + imagenes().length"
                      (click)="imagenActiva.set(img)"
                    >
                      <img [src]="img.url_cloudflare_s3" alt="" loading="lazy" decoding="async">
                    </button>
                  }
                </div>
              }
            </div>

            <div class="info">
              <span class="category">{{ p.categoria?.nombre }}</span>
              <h1>{{ p.nombre }}</h1>

              <div class="price">S/ {{ p.precio_venta | number:'1.2-2' }}</div>

              <div class="aviso-ref" role="note">
                <svg class="aviso-ref__icon" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5v.01"/>
                </svg>
                <p>
                  Los precios, tallas y disponibilidad son <strong>referenciales</strong> y pueden
                  variar. Te recomendamos
                  @if (waLink()) {
                    <a [href]="waLink()" target="_blank" rel="noopener noreferrer">confirmarlos por WhatsApp</a>
                  } @else {
                    confirmarlos por WhatsApp
                  }
                  antes de tu compra.
                </p>
              </div>

              <div class="attrs">
                <div class="attr"><span class="attr-label">Material</span><span>{{ p.material }}</span></div>
                <div class="attr"><span class="attr-label">Color</span><span>{{ p.color }}</span></div>
              </div>

              @if (p.stock_disponible > 0) {
                <div class="talla-section">
                  <span class="attr-label">Talla</span>
                  <div class="talla-options">
                    @for (t of p.tallas ?? []; track t.id) {
                      <button
                        type="button"
                        class="talla-btn"
                        [class.selected]="tallaSel()?.id === t.id"
                        [disabled]="t.stock_disponible === 0"
                        [title]="t.stock_disponible === 0 ? 'Sin stock' : t.stock_disponible + ' disponibles'"
                        (click)="seleccionarTalla(t)"
                      >
                        {{ t.talla }}
                      </button>
                    }
                  </div>
                  @if (tallaSel(); as t) {
                    <p class="talla-stock-info" [class.pocas]="t.stock_disponible <= 3">
                      {{ t.stock_disponible }} {{ t.stock_disponible === 1 ? 'unidad' : 'unidades' }} en talla {{ t.talla }}
                    </p>
                  } @else {
                    <p class="talla-stock-info hint">Selecciona una talla para continuar.</p>
                  }
                </div>
              }

              <div class="description">
                <h3>Descripcion</h3>
                <p>{{ p.descripcion_ia ?? p.descripcion_manual ?? 'Prenda tradicional de calidad, confeccionada en Arequipa.' }}</p>
              </div>

              @if (p.stock_disponible > 0) {
                <div class="actions">
                  <div class="qty-control">
                    <button (click)="cambiarCantidad(-1)" [disabled]="cantidad() <= 1">−</button>
                    <span>{{ cantidad() }}</span>
                    <button (click)="cambiarCantidad(1)" [disabled]="!tallaSel() || cantidad() >= (tallaSel()?.stock_disponible ?? 0)">+</button>
                  </div>
                  <button class="btn btn-primary btn-block" (click)="agregarCarrito()" [disabled]="agregando() || !tallaSel()">
                    @if (agregando()) {
                      <span class="spinner"></span> Agregando...
                    } @else {
                      Agregar al carrito
                    }
                  </button>
                </div>

                @if (mensaje()) {
                  <div class="alert alert-success mt-2">{{ mensaje() }}</div>
                }
              } @else {
                <div class="alert alert-error">Producto agotado.</div>
              }

              @if (waLink()) {
                <a
                  class="btn btn-wa btn-block mt-2"
                  [href]="waLink()"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  💬 Consultar por WhatsApp
                </a>
              }
            </div>
          </div>
        } @else {
          <p class="text-center text-muted">Producto no encontrado.</p>
        }
      }
    </div>
  `,
  styleUrls: ['./producto-detalle.component.scss'],
})
export class ProductoDetalleComponent implements OnInit {
  private productoSvc = inject(ProductoService);
  private carritoSvc = inject(CarritoService);
  private authSvc = inject(AuthService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private checkoutSvc = inject(CheckoutService);

  @Input() id?: string;

  producto = signal<Producto | null>(null);
  imagenes = signal<Imagen[]>([]);
  imagenActiva = signal<Imagen | null>(null);
  loading = signal(true);

  tallaSel = signal<ProductoTalla | null>(null);
  cantidad = signal(1);
  agregando = signal(false);
  mensaje = signal('');

  ngOnInit(): void {
    if (!this.checkoutSvc.config()) {
      this.checkoutSvc.obtenerConfig().subscribe({ error: () => {} });
    }

    const productoId = Number(this.id ?? this.route.snapshot.paramMap.get('id'));
    this.productoSvc.obtenerPublico(productoId).subscribe({
      next: (res) => {
        const p = res.data;
        this.producto.set(p);
        this.imagenes.set(p.imagenes ?? []);
        this.imagenActiva.set(p.imagenes?.find((i) => i.es_principal) ?? p.imagenes?.[0] ?? null);

        const disponibles = (p.tallas ?? []).filter((t) => t.stock_disponible > 0);
        if (disponibles.length === 1) {
          this.tallaSel.set(disponibles[0]);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  indiceActivo = computed(() => {
    const activa = this.imagenActiva();
    return Math.max(0, this.imagenes().findIndex((i) => i.id === activa?.id));
  });

  mover(delta: number): void {
    const lista = this.imagenes();
    if (lista.length < 2) return;
    const siguiente = (this.indiceActivo() + delta + lista.length) % lista.length;
    this.imagenActiva.set(lista[siguiente]);
  }

  seleccionarTalla(t: ProductoTalla): void {
    if (t.stock_disponible <= 0) return;
    this.tallaSel.set(t);
    this.cantidad.update((c) => Math.min(c, t.stock_disponible));
  }

  cambiarCantidad(delta: number): void {
    const max = this.tallaSel()?.stock_disponible ?? 1;
    this.cantidad.update((c) => Math.min(max, Math.max(1, c + delta)));
  }

  waLink(): string {
    const numero = this.checkoutSvc.config()?.whatsapp_tienda ?? '';
    const p = this.producto();
    if (!numero || !p) return '';

    return buildConsultaLink(p, numero, {
      talla: this.tallaSel()?.talla,
      cantidad: this.cantidad(),
    });
  }

  agregarCarrito(): void {
    if (!this.authSvc.isLoggedIn()) {
      window.location.href = '/auth/login';
      return;
    }
    const p = this.producto();
    const talla = this.tallaSel();
    if (!p) return;
    if (!talla) {
      this.toast.warning('Selecciona una talla primero.');
      return;
    }

    this.agregando.set(true);
    this.carritoSvc.agregar(p.id, talla.id, this.cantidad()).subscribe({
      next: () => {
        this.agregando.set(false);
        const msg = `Producto agregado al carrito (Talla ${talla.talla}).`;
        this.mensaje.set(msg);
        this.toast.success(msg);
        setTimeout(() => this.mensaje.set(''), 3000);
      },
      error: (err) => {
        this.agregando.set(false);
        const msg = err.error?.message ?? 'Error al agregar.';
        this.mensaje.set(msg);
        this.toast.error(msg);
      },
    });
  }
}