import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../../core/services/carrito.service';
import { CheckoutService, MetodoPago, CulqiCuota } from '../../core/services/checkout.service';
import { CulqiService } from '../../core/services/culqi.service';
import { PedidoService } from '../../core/services/pedido.service';
import { PagoService, MetodoPagoId } from '../../core/services/pago.service';
import { Carrito, DetalleCarrito } from '../../core/models/carrito.model';
import { Pedido } from '../../core/models/pedido.model';

type Paso = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-checkout',
  standalone: true,
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
                    <input [(ngModel)]="direccion.ciudad" class="form-control" placeholder="Cusco" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Codigo postal</label>
                    <input [(ngModel)]="direccion.cp" class="form-control" placeholder="08000">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Telefono</label>
                    <input [(ngModel)]="direccion.telefono" class="form-control" placeholder="+51 999888777" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Referencia</label>
                    <input [(ngModel)]="direccion.referencia" class="form-control" placeholder="Cerca de...">
                  </div>
                </div>
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

                  @if (metodoSeleccionado() === 'tarjeta' && !culqiActivo()) {
                    <div class="alert alert-info mt-2">
                      ℹ️ Culqi no configurado en backend. Puedes elegir contraentrega o Yape.
                      Configura CULQI_PUBLIC_KEY y CULQI_SECRET_KEY en backend/.env para activar pagos con tarjeta.
                    </div>
                  }
                }

                <div class="step-actions">
                  <button class="btn btn-secondary" (click)="irPaso(1)">← Volver</button>
                  <button class="btn btn-primary" (click)="irPaso(3)" [disabled]="!metodoSeleccionado()">Revisar pedido →</button>
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
                      Confirmar y pagar
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
                  <div class="alert alert-info">Pago pendiente de confirmacion. Te avisaremos cuando se confirme.</div>
                }
                <div class="step-actions" style="justify-content: center;">
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
  private culqiSvc = inject(CulqiService);
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

  culqiActivo = this.culqiSvc.configurado;

  metodos = computed(() => this.checkoutSvc.config()?.metodos_pago ?? []);

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

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.carritoSvc.obtener().subscribe({
      next: (res) => {
        this.carritoSvc['_carrito'].set(res.data);
        if (!res.data.detalles || res.data.detalles.length === 0) {
          this.router.navigate(['/carrito']);
        }
      },
      error: () => this.router.navigate(['/carrito']),
    });

    this.loadingConfig.set(true);
    this.checkoutSvc.obtenerConfig().subscribe({
      next: () => {
        this.loadingConfig.set(false);
        this.culqiSvc.cargarConfig().subscribe();
      },
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

  confirmarPedido(): void {
    this.procesando.set(true);
    this.error.set('');

    this.pedidoSvc.checkout(this.formatearDireccion()).subscribe({
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

  private async procesarPago(pedido: Pedido): Promise<void> {
    const metodo = this.metodoSeleccionado()!;

    if (metodo === 'tarjeta') {
      try {
        const token = await this.culqiSvc.abrirFormularioCulqi();
        this.pagoSvc
          .registrar(pedido.id, {
            metodo_pago: 'tarjeta',
            culqi_token: token.id,
          })
          .subscribe({
            next: (res) => this.finalizar(res.data.pedido),
            error: (err) => this.fallarPago(err),
          });
      } catch (e: any) {
        this.procesando.set(false);
        this.error.set(e.message ?? 'Pago con tarjeta cancelado.');
      }
    } else {
      this.pagoSvc
        .registrar(pedido.id, {
          metodo_pago: metodo,
          estado_pago: metodo === 'contraentrega' ? 'pendiente' : 'completado',
        })
        .subscribe({
          next: (res) => this.finalizar(res.data.pedido),
          error: (err) => this.fallarPago(err),
        });
    }
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
    this.error.set(msg + ' El pedido fue creado pero el pago fallo. Contactanos.');
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