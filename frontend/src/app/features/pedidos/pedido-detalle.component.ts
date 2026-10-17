import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PedidoService } from '../../core/services/pedido.service';
import { CheckoutService } from '../../core/services/checkout.service';
import { Pedido, EstadoPedido } from '../../core/models/pedido.model';

interface PasoTimeline {
  id: EstadoPedido;
  titulo: string;
  detalle: string;
  completado: boolean;
  actual: boolean;
  fecha?: string | null;
}

@Component({
  selector: 'app-pedido-detalle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container page">
      <a routerLink="/mis-pedidos" class="back-link">← Volver a mis pedidos</a>

      @if (loading()) {
        <div class="loading-overlay"><span class="spinner spinner-lg"></span></div>
      } @else if (error()) {
        <div class="empty card">
          <span class="empty-icon">⚠️</span>
          <h3>No pudimos abrir este pedido</h3>
          <p class="text-muted">{{ error() }}</p>
          <a routerLink="/mis-pedidos" class="btn btn-primary">Ver mis pedidos</a>
        </div>
      } @else {
        @if (pedido(); as p) {
        <header class="head">
          <div>
            <h1>Pedido #{{ p.id }}</h1>
            <p class="text-muted">Realizado el {{ p.fecha_pedido | date:'dd MMMM y, HH:mm' }}</p>
          </div>
          <span class="badge-estado be-{{ p.estado_pedido }}">{{ labelEstado(p.estado_pedido) }}</span>
        </header>

        @if (p.estado_pedido === 'cancelado') {
          <div class="alert alert-error">
            Este pedido fue cancelado. Si fue un error, escribenos por WhatsApp y lo revisamos.
          </div>
        } @else if (p.estado_pedido === 'pendiente') {
          <div class="alert alert-info">
            @if (p.pago?.metodo_pago === 'yape') {
              Recibimos tu comprobante. Estamos verificandolo y te escribiremos para coordinar el envio.
            } @else if (p.pago?.metodo_pago === 'contraentrega') {
              Pagas en efectivo al recibir. Te contactaremos para coordinar la entrega.
            } @else {
              Tu pago esta pendiente de confirmacion. Te avisaremos en cuanto se acredite.
            }
          </div>
        }

        <div class="layout">
          <div class="col-main">
            <section class="card bloque">
              <h3>Estado del pedido</h3>
              <ol class="timeline">
                @for (paso of timeline(); track paso.id) {
                  <li class="paso" [class.completado]="paso.completado" [class.actual]="paso.actual">
                    <span class="marcador">{{ paso.completado ? '✓' : '' }}</span>
                    <div class="paso-txt">
                      <strong>{{ paso.titulo }}</strong>
                      <span class="text-muted">{{ paso.detalle }}</span>
                      @if (paso.fecha) {
                        <span class="paso-fecha">{{ paso.fecha | date:'dd MMM y, HH:mm' }}</span>
                      }
                    </div>
                  </li>
                }
              </ol>
            </section>

            <section class="card bloque">
              <h3>Productos</h3>
              <ul class="items">
                @for (d of p.detalles ?? []; track d.id) {
                  <li>
                    @if (d.producto?.imagen_principal_url) {
                      <img [src]="d.producto?.imagen_principal_url" [alt]="d.producto?.nombre" loading="lazy">
                    } @else {
                      <span class="img-fallback"></span>
                    }
                    <div class="item-info">
                      <a [routerLink]="['/producto', d.producto_id]" class="item-nombre">
                        {{ d.producto?.nombre ?? 'Producto' }}
                      </a>
                      <span class="item-meta">
                        @if (d.talla) { Talla {{ d.talla }} · }
                        S/ {{ d.precio_unitario | number:'1.2-2' }} c/u · Cantidad {{ d.cantidad }}
                      </span>
                    </div>
                    <span class="item-sub">S/ {{ d.subtotal | number:'1.2-2' }}</span>
                  </li>
                }
              </ul>

              <div class="totales">
                <div class="linea"><span>Subtotal</span><span>S/ {{ p.total | number:'1.2-2' }}</span></div>
                <div class="linea"><span>Envio</span><span class="text-muted">A coordinar</span></div>
                <div class="linea total"><span>Total</span><strong>S/ {{ p.total | number:'1.2-2' }}</strong></div>
              </div>
            </section>
          </div>

          <aside class="col-side">
            <section class="card bloque">
              <h3>Pago</h3>
              @if (p.pago; as pago) {
                <dl class="datos">
                  <dt>Metodo</dt>
                  <dd>{{ iconoMetodo(pago.metodo_pago) }} {{ pago.metodo_pago }}</dd>
                  <dt>Estado</dt>
                  <dd>
                    <span class="badge-estado bp-{{ pago.estado_pago }}">{{ labelEstadoPago(pago.estado_pago) }}</span>
                  </dd>
                  <dt>Monto</dt>
                  <dd>S/ {{ pago.monto | number:'1.2-2' }}</dd>
                  @if (pago.fecha_pago) {
                    <dt>Fecha</dt>
                    <dd>{{ pago.fecha_pago | date:'dd MMM y, HH:mm' }}</dd>
                  }
                </dl>

                @if (pago.comprobante_url) {
                  <div class="comprobante">
                    <span class="text-muted small">Tu comprobante</span>
                    <a [href]="pago.comprobante_url" target="_blank" rel="noopener noreferrer">
                      <img [src]="pago.comprobante_url" alt="Comprobante de pago del pedido" loading="lazy">
                    </a>
                  </div>
                }
              } @else {
                <p class="text-muted">Este pedido aun no tiene un pago registrado.</p>
              }
            </section>

            <section class="card bloque">
              <h3>Envio</h3>
              <dl class="datos">
                <dt>Direccion</dt>
                <dd class="pre-line">{{ p.direccion_envio || '—' }}</dd>
                @if (p.telefono) {
                  <dt>Telefono</dt>
                  <dd>{{ p.telefono }}</dd>
                }
              </dl>
              @if (p.notas) {
                <p class="notas text-muted">Notas: {{ p.notas }}</p>
              }
              @if (waLink(); as link) {
                <a class="btn btn-block wa" [href]="link" target="_blank" rel="noopener noreferrer">
                  💬 Coordinar por WhatsApp
                </a>
              }
            </section>
          </aside>
        </div>
        }
      }
    </div>
  `,
  styleUrls: ['./pedido-detalle.component.scss'],
})
export class PedidoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private pedidoSvc = inject(PedidoService);
  private checkoutSvc = inject(CheckoutService);

  pedido = signal<Pedido | null>(null);
  loading = signal(true);
  error = signal('');

  private static readonly FLUJO: { id: EstadoPedido; titulo: string; detalle: string }[] = [
    { id: 'pendiente', titulo: 'Pedido recibido', detalle: 'Registramos tu compra.' },
    { id: 'pagado', titulo: 'Pago confirmado', detalle: 'Acreditamos tu pago.' },
    { id: 'enviado', titulo: 'Enviado', detalle: 'Tu pedido va en camino.' },
    { id: 'entregado', titulo: 'Entregado', detalle: 'Lo recibiste conforme.' },
  ];

  timeline = computed<PasoTimeline[]>(() => {
    const p = this.pedido();
    if (!p || p.estado_pedido === 'cancelado') return [];

    const indice = PedidoDetalleComponent.FLUJO.findIndex((f) => f.id === p.estado_pedido);

    return PedidoDetalleComponent.FLUJO.map((paso, i) => ({
      id: paso.id,
      titulo: paso.titulo,
      detalle: paso.detalle,
      completado: i <= indice,
      actual: i === indice,
      fecha: this.fechaDe(paso.id, p),
    }));
  });

  waLink = computed(() => {
    const numero = this.checkoutSvc.config()?.whatsapp_tienda ?? '';
    const p = this.pedido();
    if (!numero || !p || p.estado_pedido === 'entregado' || p.estado_pedido === 'cancelado') return '';

    const msg = `Hola Hancco Artesanias! Escribo por mi pedido #${p.id} (S/ ${p.total}), actualmente "${this.labelEstado(p.estado_pedido)}".`;
    return `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
  });

  ngOnInit(): void {
    this.checkoutSvc.obtenerConfig().subscribe({ error: () => {} });

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || Number.isNaN(id)) {
      this.loading.set(false);
      this.error.set('El numero de pedido no es valido.');
      return;
    }

    this.cargar(id);
  }

  private cargar(id: number): void {
    this.pedidoSvc.miPedido(id).subscribe({
      next: (res) => {
        this.pedido.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err.status === 403
            ? 'Este pedido no te pertenece.'
            : (err.error?.message ?? 'No encontramos el pedido solicitado.')
        );
      },
    });
  }

  private fechaDe(estado: EstadoPedido, p: Pedido): string | null {
    if (estado === 'pendiente') return p.fecha_pedido;
    if (estado === 'pagado') return p.pago?.fecha_pago ?? null;
    return null;
  }

  labelEstado(estado: EstadoPedido | ''): string {
    return (
      {
        pendiente: 'Pendiente',
        pagado: 'Pagado',
        enviado: 'Enviado',
        entregado: 'Entregado',
        cancelado: 'Cancelado',
      } as Record<string, string>
    )[estado] ?? 'Pendiente';
  }

  labelEstadoPago(estado?: string): string {
    return (
      {
        pendiente: 'Por confirmar',
        completado: 'Confirmado',
        fallido: 'Fallido',
        reembolsado: 'Reembolsado',
      } as Record<string, string>
    )[estado ?? ''] ?? (estado ?? '—');
  }

  iconoMetodo(metodo?: string): string {
    return (
      {
        yape: '📱',
        plin: '📲',
        contraentrega: '🚚',
        tarjeta: '💳',
        transferencia: '🏦',
      } as Record<string, string>
    )[metodo ?? ''] ?? '❔';
  }
}
