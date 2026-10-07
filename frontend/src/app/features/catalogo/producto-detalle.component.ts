import { Component, OnInit, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductoService } from '../../core/services/producto.service';
import { CarritoService } from '../../core/services/carrito.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Producto, ProductoTalla, Imagen } from '../../core/models/producto.model';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
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
                  <img [src]="img.url_cloudflare_s3" [alt]="p.nombre">
                  @if (img.generada_ia) {
                    <span class="badge-ia">✨ Mejorada con IA</span>
                  }
                </div>
              } @else {
                <div class="main-img no-image">Sin imagen disponible</div>
              }

              @if (imagenes().length > 1) {
                <div class="thumbs">
                  @for (img of imagenes(); track img.id) {
                    <button
                      class="thumb-btn"
                      [class.active]="imagenActiva()?.id === img.id"
                      (click)="imagenActiva.set(img)"
                    >
                      <img [src]="img.url_cloudflare_s3" [alt]="p.nombre">
                    </button>
                  }
                </div>
              }
            </div>

            <div class="info">
              <span class="category">{{ p.categoria?.nombre }}</span>
              <h1>{{ p.nombre }}</h1>

              <div class="price">S/ {{ p.precio_venta | number:'1.2-2' }}</div>

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
                <p>{{ p.descripcion_ia ?? p.descripcion_manual ?? 'Prenda artesanal hecha a mano con fibra de alpaca.' }}</p>
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

  seleccionarTalla(t: ProductoTalla): void {
    if (t.stock_disponible <= 0) return;
    this.tallaSel.set(t);
    this.cantidad.update((c) => Math.min(c, t.stock_disponible));
  }

  cambiarCantidad(delta: number): void {
    const max = this.tallaSel()?.stock_disponible ?? 1;
    this.cantidad.update((c) => Math.min(max, Math.max(1, c + delta)));
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