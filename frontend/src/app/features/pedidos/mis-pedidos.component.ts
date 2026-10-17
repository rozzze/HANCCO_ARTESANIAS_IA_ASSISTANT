import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PedidoService } from '../../core/services/pedido.service';
import { ToastService } from '../../core/services/toast.service';
import { Pedido, EstadoPedido } from '../../core/models/pedido.model';

interface FiltroEstado {
  id: EstadoPedido | '';
  label: string;
  icono: string;
}

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container page">
      <header class="head">
        <div>
          <h1>Mis pedidos</h1>
          <p class="text-muted">Sigue el estado de cada una de tus compras.</p>
        </div>
        <a routerLink="/catalogo" class="btn btn-secondary">Seguir comprando</a>
      </header>

      <div class="filtros">
        @for (f of filtros; track f.id) {
          <button
            type="button"
            class="chip"
            [class.on]="filtroActual() === f.id"
            (click)="aplicarFiltro(f.id)"
          >
            <span class="chip-icono">{{ f.icono }}</span>{{ f.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading-overlay"><span class="spinner spinner-lg"></span></div>
      } @else if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      } @else if (pedidos().length === 0) {
        <div class="empty card">
          <span class="empty-icon">🧺</span>
          <h3>Aun no tienes pedidos</h3>
          <p class="text-muted">
            @if (filtroActual()) {
              No encontramos pedidos con estado "{{ labelEstado(filtroActual()) }}".
            } @else {
              Cuando hagas tu primera compra aparecera aqui con su estado en tiempo real.
            }
          </p>
          <div class="empty-actions">
            @if (filtroActual()) {
              <button type="button" class="btn btn-secondary" (click)="aplicarFiltro('')">Ver todos</button>
            }
            <a routerLink="/catalogo" class="btn btn-primary">Explorar catalogo</a>
          </div>
        </div>
      } @else {
        <div class="lista">
          @for (p of pedidos(); track p.id) {
            <article class="pedido card">
              <header class="pedido-head">
                <div class="pedido-idbox">
                  <a [routerLink]="['/mis-pedidos', p.id]" class="pedido-id">#{{ p.id }}</a>
                  <span class="pedido-fecha">{{ p.fecha_pedido | date:'dd MMM y, HH:mm' }}</span>
                </div>
                <span class="badge-estado be-{{ p.estado_pedido }}">{{ labelEstado(p.estado_pedido) }}</span>
              </header>

              <div class="progreso" [attr.data-estado]="p.estado_pedido" aria-hidden="true">
                @for (paso of pasosProgreso(p); track paso.id) {
                  <span class="paso" [class.activo]="paso.activo" [class.actual]="paso.actual">
                    <span class="punto"></span>
                  </span>
                }
              </div>

              <ul class="pedido-items">
                @for (d of itemsVisibles(p); track d.id) {
                  <li>
                    @if (d.producto?.imagen_principal_url) {
                      <img [src]="d.producto?.imagen_principal_url" [alt]="d.producto?.nombre" loading="lazy">
                    } @else {
                      <span class="img-fallback"></span>
                    }
                    <span class="item-nombre">
                      {{ d.cantidad }}x {{ d.producto?.nombre ?? 'Producto' }}
                      @if (d.talla) { <small>Talla {{ d.talla }}</small> }
                    </span>
                    <span class="item-sub">S/ {{ d.subtotal | number:'1.2-2' }}</span>
                  </li>
                }
                @if ((p.detalles?.length ?? 0) > maxItemsPreview) {
                  <li class="mas-items">
                    +{{ (p.detalles?.length ?? 0) - maxItemsPreview }} producto(s) mas
                  </li>
                }
              </ul>

              <footer class="pedido-foot">
                <div class="pago">
                  @if (p.pago; as pago) {
                    <span class="pago-metodo">{{ iconoMetodo(pago.metodo_pago) }} {{ pago.metodo_pago }}</span>
                    <span class="pago-estado" [class.ok]="pago.estado_pago === 'completado'"
                          [class.bad]="pago.estado_pago === 'fallido'">
                      {{ labelEstadoPago(pago.estado_pago) }}
                    </span>
                  } @else {
                    <span class="pago-metodo text-muted">Sin pago registrado</span>
                  }
                </div>
                <div class="total-box">
                  <span class="total-label">Total</span>
                  <strong class="total">S/ {{ p.total | number:'1.2-2' }}</strong>
                </div>
                <a [routerLink]="['/mis-pedidos', p.id]" class="btn btn-primary btn-sm">Ver detalle →</a>
              </footer>
            </article>
          }
        </div>

        @if (ultimaPagina() > 1) {
          <nav class="pagination">
            <button class="btn btn-secondary" [disabled]="pagina() === 1" (click)="cambiarPagina(pagina() - 1)">← Anterior</button>
            <span class="page-info">Pagina {{ pagina() }} de {{ ultimaPagina() }} · {{ total() }} pedido(s)</span>
            <button class="btn btn-secondary" [disabled]="pagina() === ultimaPagina()" (click)="cambiarPagina(pagina() + 1)">Siguiente →</button>
          </nav>
        } @else {
          <p class="text-center text-muted total-simple">{{ total() }} pedido(s)</p>
        }
      }
    </div>
  `,
  styleUrls: ['./mis-pedidos.component.scss'],
})
export class MisPedidosComponent implements OnInit {
  private pedidoSvc = inject(PedidoService);
  private toast = inject(ToastService);

  readonly maxItemsPreview = 3;

  readonly filtros: FiltroEstado[] = [
    { id: '', label: 'Todos', icono: '📋' },
    { id: 'pendiente', label: 'Pendientes', icono: '⏳' },
    { id: 'pagado', label: 'Pagados', icono: '💰' },
    { id: 'enviado', label: 'Enviados', icono: '📦' },
    { id: 'entregado', label: 'Entregados', icono: '✅' },
    { id: 'cancelado', label: 'Cancelados', icono: '✖' },
  ];

  pedidos = signal<Pedido[]>([]);
  loading = signal(true);
  error = signal('');
  filtroActual = signal<EstadoPedido | ''>('');
  pagina = signal(1);
  ultimaPagina = signal(1);
  total = signal(0);

  private static readonly FLUJO: EstadoPedido[] = ['pendiente', 'pagado', 'enviado', 'entregado'];

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set('');

    this.pedidoSvc
      .misPedidos({
        estado_pedido: this.filtroActual(),
        page: this.pagina(),
        per_page: 10,
      })
      .subscribe({
        next: (res) => {
          this.pedidos.set(res.data ?? []);
          this.total.set(res.meta?.total ?? 0);
          this.ultimaPagina.set(res.meta?.last_page ?? 1);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message ?? 'No pudimos cargar tus pedidos. Intenta de nuevo.');
          this.toast.error(this.error());
        },
      });
  }

  aplicarFiltro(estado: EstadoPedido | ''): void {
    this.filtroActual.set(estado);
    this.pagina.set(1);
    this.cargar();
  }

  cambiarPagina(p: number): void {
    this.pagina.set(p);
    this.cargar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  itemsVisibles(p: Pedido) {
    return (p.detalles ?? []).slice(0, this.maxItemsPreview);
  }

  pasosProgreso(p: Pedido): { id: EstadoPedido; activo: boolean; actual: boolean }[] {
    if (p.estado_pedido === 'cancelado') return [];

    const indice = MisPedidosComponent.FLUJO.indexOf(p.estado_pedido);
    return MisPedidosComponent.FLUJO.map((estado, i) => ({
      id: estado,
      activo: i <= indice,
      actual: i === indice,
    }));
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
