import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../../core/services/carrito.service';
import { CheckoutService } from '../../core/services/checkout.service';
import { PedidoService } from '../../core/services/pedido.service';
import { PagoService, MetodoPagoId } from '../../core/services/pago.service';
import { Pedido } from '../../core/models/pedido.model';

type Paso = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-checkout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container page">
      <a routerLink="/carrito" class="back-link">← Volver al carrito</a>

      <header class="checkout-head">
        <h1>Finalizar compra</h1>
        <div class="steps">
          <div class="step" [class.active]="paso() === 1" [class.done]="paso() > 1">
            <span class="num">1</span> Direccion
          </div>
          <div class="step" [class.active]="paso() === 2" [class.done]="paso() > 2">
            <span class="num">2</span> Pago
          </div>
          <div class="step" [class.active]="paso() === 3" [class.done]="paso() > 3">
            <span class="num">3</span> Confirmar
          </div>
        </div>
      </header>

      <div class="layout">
        <main class="main-pane">
          @switch (paso()) {
            @case (1) {
              <section class="step-pane">
                <h2>Direccion de envio</h2>
                <div class="form-grid">
                  <div class="form-group full">
                    <label class="form-label">Nombre completo</label>
                    <input [(ngModel)]="direccion.nombre" class="form-control" placeholder="Juan Perez" required>
                  </div>
                  <div class="form-group full">
                    <label class="form-label">Direccion</label>
                    <input [(ngModel)]="direccion.calle" class="form-control" placeholder="Av. Ejemplo 123" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Ciudad</label>
                    <input [(ngModel)]="direccion.ciudad" class="form-control" placeholder="Arequipa" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Codigo postal</label>
                    <input [(ngModel)]="direccion.cp" class="form-control" placeholder="04000">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Telefono / WhatsApp *</label>
                    <input [(ngModel)]="direccion.telefono" class="form-control" placeholder="999888777" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Referencia</label>
                    <input [(ngModel)]="direccion.referencia" class="form-control" placeholder="Cerca de...">
                  </div>
                </div>
                <p class="text-muted small">Usamos tu telefono para coordinar el envio por WhatsApp.</p>
                <div class="step-actions">
                  <button class="btn btn-primary" (click)="irPaso(2)" [disabled]="!direccionValida()">Continuar al pago →</button>
                </div>
              </section>
            }

            @case (2) {
              <section class="step-pane">
                <h2>Metodo de pago</h2>

                @if (loadingConfig()) {
                  <div class="loading-overlay"><span class="spinner spinner-lg"></span></div>
                } @else {
                  <div class="metodos">
                    @for (m of metodos(); track m.id) {
                      <label class="metodo-card" [class.selected]="metodoSeleccionado() === m.id">
                        <input type="radio" name="metodo" [value]="m.id" [checked]="metodoSeleccionado() === m.id" (change)="metodoSeleccionado.set($any(m.id))">
                        <span class="metodo-icon">{{ m.icono }}</span>
                        <div class="metodo-info">
                          <strong>{{ m.nombre }}</strong>
                          <span class="text-muted">{{ m.descripcion }}</span>
                        </div>
                      </label>
                    }
                  </div>

                  @if (metodoSeleccionado() === 'yape') {
                    <div class="yape-panel">
                      <h4>Yapea el total: <strong class="yape-total">S/ {{ carrito()?.total | number:'1.2-2' }}</strong></h4>
                      @if (yapeQr()) {
                        <img [src]="yapeQr()" alt="QR Yape" class="yape-qr">
                      }
                      <div class="yape-numero">
                        <span class="text-muted small">Numero Yape:</span>
                        <strong>{{ yapeNumero() }}</strong>
                        <button type="button" class="btn btn-secondary btn-sm" (click)="copiarYape()">
                          {{ yapeCopiado() ? '✓ Copiado' : '⧉ Copiar' }}
                        </button>
                      </div>
                      <p class="text-muted small">
                        Haz el yape por el monto exacto y sube la captura como comprobante. Verificamos tu pago y coordinamos el envio.
                      </p>
                      <div class="comprobante-row">
                        <input type="file" accept="image/*" #compInput hidden (change)="onComprobante($event)">
                        <button type="button" class="btn btn-secondary btn-sm" (click)="compInput.click()">📎 Subir comprobante</button>
                        @if (comprobante()) {
                          <span class="comp-ok">✓ {{ comprobante()!.name }}</span>
                        } @else {
                          <span class="text-muted small">Obligatorio para Yape</span>
                        }
                      </div>
                    </div>
                  }

                  @if (metodoSeleccionado() === 'contraentrega') {
                    <div class="alert alert-info mt-2">
                      🚚 Pagas en efectivo al recibir tu pedido. Ten listo el monto exacto: S/ {{ carrito()?.total | number:'1.2-2' }}
                    </div>
                  }
                }

                <div class="step-actions">
                  <button class="btn btn-secondary" (click)="irPaso(1)">← Volver</button>
                  <button class="btn btn-primary" (click)="irPaso(3)" [disabled]="!pagoListo()">Revisar pedido →</button>
                </div>
              </section>
            }

            @case (3) {
              <section class="step-pane">
                <h2>Confirma tu pedido</h2>

                <div class="resumen">
                  <div class="resumen-block">
                    <h4>Enviar a</h4>
                    <p>{{ direccion.nombre }}<br>{{ direccion.calle }}<br>{{ direccion.ciudad }}@if (direccion.cp) {, {{ direccion.cp }}}<br>Tel: {{ direccion.telefono }}</p>
                    @if (direccion.referencia) {
                      <p class="text-muted small">Ref: {{ direccion.referencia }}</p>
                    }
                  </div>

                  <div class="resumen-block">
                    <h4>Metodo de pago</h4>
                    <p>
                      {{ metodoIcono() }} {{ metodoNombre() }}
                      @if (metodoSeleccionado() === 'yape' && comprobante()) {
                        <span class="text-muted small"><br>Comprobante: {{ comprobante()!.name }}</span>
                      }
                    </p>
                  </div>

                  <div class="resumen-block">
                    <h4>Items</h4>
                    @for (item of carrito()?.detalles ?? []; track item.id) {
                      <div class="item-row">
                        <span>{{ item.cantidad }}x {{ item.producto?.nombre }}@if (item.talla) { <small class="item-talla">(Talla {{ item.talla }})</small>}</span>
                        <span>S/ {{ item.subtotal | number:'1.2-2' }}</span>
                      </div>
                    }
                  </div>
                </div>

                @if (error()) {
                  <div class="alert alert-error mt-2">{{ error() }}</div>
                }

                <div class="step-actions">
                  <button class="btn btn-secondary" (click)="irPaso(2)" [disabled]="procesando()">← Volver</button>
                  <button class="btn btn-primary btn-lg" (click)="confirmarPedido()" [disabled]="procesando()">
                    @if (procesando()) {
                      <span class="spinner"></span> Procesando...
                    } @else {
                      Confirmar pedido
                    }
                  </button>
                </div>
              </section>
            }

            @case (4) {
              <section class="step-pane text-center">
                <div class="success-icon">✓</div>
                <h2>Pedido confirmado</h2>
                <p class="text-muted">Tu pedido ha sido creado. Numero de orden: <strong>#{{ pedidoFinal()?.id }}</strong></p>
                @if (pedidoFinal()?.estado_pedido === 'pagado') {
                  <div class="alert alert-success">Pago confirmado. Te contactaremos pronto.</div>
                } @else {
                  <div class="alert alert-info">
                    @if (pedidoFinal()?.pago?.metodo_pago === 'yape') {
                      Recibimos tu comprobante. Lo verificamos y te escribimos por WhatsApp para coordinar el envio.
                    } @else {
                      Pago pendiente de confirmacion. Te avisaremos cuando se confirme.
                    }
                  </div>
                }
                @if (waTiendaLink()) {
                  <a class="btn btn-primary" [href]="waTiendaLink()" target="_blank" rel="noopener noreferrer">
                    💬 Coordinar envio por WhatsApp
                  </a>
                }
                <div class="step-actions" style="justify-content: center;">
                  <a routerLink="/mis-pedidos" class="btn btn-primary">Ver mis pedidos</a>
                  <a routerLink="/" class="btn btn-secondary">Volver al inicio</a>
                </div>
              </section>
            }
          }
        </main>

        @if (paso() < 4) {
          <aside class="summary-pane">
            <h3>Resumen</h3>
            <div class="sum-line"><span>Subtotal</span><span>S/ {{ carrito()?.total | number:'1.2-2' }}</span></div>
            <div class="sum-line"><span>Envio</span><span class="text-muted">A calcular</span></div>
            <div class="sum-line total"><span>Total</span><span>S/ {{ carrito()?.total | number:'1.2-2' }}</span></div>
            <div class="sum-items">
              @for (item of carrito()?.detalles?.slice(0, 3) ?? []; track item.id) {
                <div class="sum-item">
                  @if (item.producto?.imagen_principal_url) {
                    <img [src]="item.producto?.imagen_principal_url" [alt]="item.producto?.nombre">
                  }
                  <div>
                    <span class="sum-name">{{ item.producto?.nombre }}</span>
                    <span class="sum-qty">x{{ item.cantidad }}</span>
                  </div>
                </div>
              }
              @if ((carrito()?.detalles?.length ?? 0) > 3) {
                <p class="text-muted small">+{{ (carrito()?.detalles?.length ?? 0) - 3 }} items mas</p>
              }
            </div>
          </aside>
        }
      </div>
    </div>
  `,
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit {
  private carritoSvc = inject(CarritoService);
  private checkoutSvc = inject(CheckoutService);
  private pedidoSvc = inject(PedidoService);
  private pagoSvc = inject(PagoService);
  private router = inject(Router);

  paso = signal<Paso>(1);
  carrito = this.carritoSvc.carrito;
  loadingConfig = signal(false);

  metodoSeleccionado = signal<MetodoPagoId | null>(null);
  procesando = signal(false);
  error = signal('');
  pedidoFinal = signal<Pedido | null>(null);

  comprobante = signal<File | null>(null);
  yapeCopiado = signal(false);
  private copiadoTimer: ReturnType<typeof setTimeout> | null = null;

  metodos = computed(() => this.checkoutSvc.config()?.metodos_pago ?? []);
  yapeNumero = computed(() => this.checkoutSvc.config()?.yape?.numero ?? '');
  yapeQr = computed(() => this.checkoutSvc.config()?.yape?.qr_url ?? '');

  pagoListo = computed(() => {
    const m = this.metodoSeleccionado();
    if (!m) return false;
    if (m === 'yape') return !!this.comprobante();
    return true;
  });

  direccion = {
    nombre: '',
    calle: '',
    ciudad: '',
    cp: '',
    telefono: '',
    referencia: '',
  };

  metodoNombre = computed(() => {
    const id = this.metodoSeleccionado();
    return this.metodos().find((m) => m.id === id)?.nombre ?? '';
  });

  metodoIcono = computed(() => {
    const id = this.metodoSeleccionado();
    return this.metodos().find((m) => m.id === id)?.icono ?? '';
  });

  waTiendaLink = computed(() => {
    const num = this.checkoutSvc.config()?.whatsapp_tienda ?? '';
    const pedido = this.pedidoFinal();
    if (!num || !pedido) return '';
    const msg = `Hola Hancco Artesanias! Acabo de hacer el pedido #${pedido.id} por S/ ${pedido.total}. Quisiera coordinar el envio.`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.carritoSvc.obtener().subscribe({
      next: (res) => {
        if (!res.data.detalles || res.data.detalles.length === 0) {
          this.router.navigate(['/carrito']);
        }
      },
      error: () => this.router.navigate(['/carrito']),
    });

    this.loadingConfig.set(true);
    this.checkoutSvc.obtenerConfig().subscribe({
      next: () => this.loadingConfig.set(false),
      error: () => this.loadingConfig.set(false),
    });
  }

  direccionValida(): boolean {
    return !!(this.direccion.nombre && this.direccion.calle && this.direccion.ciudad && this.direccion.telefono);
  }

  irPaso(p: Paso): void {
    this.paso.set(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onComprobante(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.comprobante.set(file);
  }

  copiarYape(): void {
    const num = this.yapeNumero();
    if (!num) return;
    const done = () => {
      this.yapeCopiado.set(true);
      if (this.copiadoTimer) clearTimeout(this.copiadoTimer);
      this.copiadoTimer = setTimeout(() => this.yapeCopiado.set(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(num).then(done).catch(done);
    } else {
      done();
    }
  }

  confirmarPedido(): void {
    this.procesando.set(true);
    this.error.set('');

    this.pedidoSvc.checkout(this.formatearDireccion(), this.direccion.telefono).subscribe({
      next: (res) => {
        const pedido = res.data;
        this.procesarPago(pedido);
      },
      error: (err) => {
        this.procesando.set(false);
        this.error.set(err.error?.message ?? 'Error al crear pedido.');
      },
    });
  }

  private procesarPago(pedido: Pedido): void {
    const metodo = this.metodoSeleccionado()!;

    this.pagoSvc
      .registrar(pedido.id, {
        metodo_pago: metodo,
        comprobante: metodo === 'yape' ? this.comprobante() : null,
      })
      .subscribe({
        next: (res) => this.finalizar(res.data.pedido),
        error: (err) => this.fallarPago(err),
      });
  }

  private finalizar(pedido: Pedido): void {
    this.pedidoFinal.set(pedido);
    this.procesando.set(false);
    this.carritoSvc.limpiar();
    this.irPaso(4);
  }

  private fallarPago(err: any): void {
    this.procesando.set(false);
    const msg = err.error?.message ?? 'Error al procesar pago.';
    this.error.set(msg + ' El pedido fue creado pero el pago fallo. Contactanos por WhatsApp.');
  }

  private formatearDireccion(): string {
    const d = this.direccion;
    let txt = `${d.nombre}\n${d.calle}\n${d.ciudad}`;
    if (d.cp) txt += `, CP ${d.cp}`;
    txt += `\nTel: ${d.telefono}`;
    if (d.referencia) txt += `\nRef: ${d.referencia}`;
    return txt;
  }
}
