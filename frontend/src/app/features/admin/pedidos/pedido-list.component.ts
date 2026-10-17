import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../../core/services/pedido.service';
import { ToastService } from '../../../core/services/toast.service';
import { Pedido, EstadoPedido } from '../../../core/models/pedido.model';

interface GrupoDia {
  clave: string;
  label: string;
  pedidos: Pedido[];
}

@Component({
  selector: 'app-pedido-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="filters-card">
        <div class="filters-grid">
          <div class="filter-field filter-search">
            <label for="f-buscar">Buscar</label>
            <input
              id="f-buscar"
              type="search"
              [(ngModel)]="buscar"
              (ngModelChange)="onBuscar()"
              placeholder="Nº pedido, cliente o correo..."
              class="form-control"
            >
          </div>
          <div class="filter-field">
            <label for="f-estado">Estado</label>
            <select id="f-estado" [(ngModel)]="filtroEstado" (ngModelChange)="onFiltro()" class="form-control">
              <option value="">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="pagado">Pagados</option>
              <option value="enviado">Enviados</option>
              <option value="entregado">Entregados</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>
          <div class="filter-field">
            <label for="f-desde">Desde</label>
            <input id="f-desde" type="date" [(ngModel)]="desde" (ngModelChange)="onFiltro()" class="form-control">
          </div>
          <div class="filter-field">
            <label for="f-hasta">Hasta</label>
            <input id="f-hasta" type="date" [(ngModel)]="hasta" (ngModelChange)="onFiltro()" class="form-control">
          </div>
          <div class="filter-field filter-actions">
            <button class="btn btn-secondary" (click)="limpiarFiltros()">Limpiar</button>
          </div>
        </div>
        <div class="stats-strip">
          <span class="stat-chip"><strong>{{ total() }}</strong> pedido(s)</span>
          <button class="stat-chip chip-click" [class.on]="filtroEstado() === 'pendiente'" (click)="toggleChip('pendiente')">
            ⏳ Pendientes
          </button>
          <button class="stat-chip chip-click" [class.on]="filtroEstado() === 'pagado'" (click)="toggleChip('pagado')">
            💰 Pagados
          </button>
          <button class="stat-chip chip-click" [class.on]="filtroEstado() === 'enviado'" (click)="toggleChip('enviado')">
            📦 Enviados
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-overlay"><span class="spinner spinner-lg"></span></div>
      } @else if (grupos().length > 0) {
        @for (g of grupos(); track g.clave) {
          <section class="dia-grupo">
            <header class="dia-head" (click)="toggleGrupo(g.clave)">
              <h3>{{ g.label }}</h3>
              <span class="dia-meta">{{ g.pedidos.length }} pedido(s) · S/ {{ sumaDia(g) | number:'1.2-2' }}</span>
              <span class="dia-toggle">{{ cerrados().includes(g.clave) ? '▸' : '▾' }}</span>
            </header>

            @if (!cerrados().includes(g.clave)) {
              <div class="tickets">
                @for (p of g.pedidos; track p.id) {
                  <article class="ticket" [class.t-pendiente]="p.estado_pedido === 'pendiente'">
                    <header class="ticket-head">
                      <div class="ticket-idbox">
                        <strong class="ticket-id">#{{ p.id }}</strong>
                        <span class="ticket-hora">{{ p.fecha_pedido | date:'HH:mm' }}</span>
                      </div>
                      <span class="badge-estado be-{{ p.estado_pedido }}">{{ p.estado_pedido }}</span>
                    </header>

                    <div class="ticket-cliente">
                      <strong>{{ p.cliente?.nombres ?? 'Cliente' }}</strong>
                      <span class="text-muted small">{{ p.cliente?.correo }}</span>
                      @if (p.telefono) {
                        <a class="wa-btn" [href]="waLink(p)" target="_blank" rel="noopener noreferrer" title="Coordinar envio por WhatsApp">
                          💬 {{ p.telefono }}
                        </a>
                      }
                    </div>

                    <ul class="ticket-items">
                      @for (d of p.detalles ?? []; track d.id) {
                        <li>
                          <span>{{ d.cantidad }}x {{ d.producto?.nombre }}@if (d.talla) { <small>({{ d.talla }})</small>}</span>
                          <span>S/ {{ d.subtotal | number:'1.2-2' }}</span>
                        </li>
                      }
                    </ul>

                    <div class="ticket-total">
                      <span>TOTAL</span>
                      <strong>S/ {{ p.total | number:'1.2-2' }}</strong>
                    </div>

                    <div class="ticket-pago">
                      <span class="pago-metodo">{{ iconoMetodo(p.pago?.metodo_pago) }} {{ p.pago?.metodo_pago ?? 'sin pago' }}</span>
                      <span class="pago-estado" [class.ok]="p.pago?.estado_pago === 'completado'">
                        {{ p.pago?.estado_pago ?? '—' }}
                      </span>
                      @if (p.pago?.comprobante_url) {
                        <button class="btn btn-secondary btn-sm" (click)="verComprobante(p)">🧾 Comprobante</button>
                      }
                    </div>

                    @if (p.direccion_envio) {
                      <p class="ticket-dir">📍 {{ p.direccion_envio }}</p>
                    }

                    <footer class="ticket-actions">
                      <select
                        [ngModel]="p.estado_pedido"
                        (ngModelChange)="cambiarEstado(p, $event)"
                        class="form-control select-sm"
                        [disabled]="actualizandoId() === p.id"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="pagado">Pagado</option>
                        <option value="enviado">Enviado</option>
                        <option value="entregado">Entregado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                      @if (p.estado_pedido === 'pendiente' && p.pago?.comprobante_url) {
                        <button class="btn btn-primary btn-sm" (click)="confirmarPago(p)" [disabled]="actualizandoId() === p.id">
                          ✓ Confirmar pago
                        </button>
                      }
                    </footer>
                  </article>
                }
              </div>
            }
          </section>
        }

        @if (ultimaPagina() > 1) {
          <nav class="pagination">
            <button class="btn btn-secondary" [disabled]="pagina() === 1" (click)="cambiarPagina(pagina() - 1)">← Anterior</button>
            <span class="page-info">Pagina {{ pagina() }} de {{ ultimaPagina() }}</span>
            <button class="btn btn-secondary" [disabled]="pagina() === ultimaPagina()" (click)="cambiarPagina(pagina() + 1)">Siguiente →</button>
          </nav>
        }
      } @else {
        <p class="text-center text-muted empty">No hay pedidos con esos filtros.</p>
      }

      @if (comprobanteDe(); as pComp) {
        <div class="modal-backdrop" (click)="cerrarComprobante()">
          <div class="modal modal-comp" (click)="$event.stopPropagation()">
            <header class="comp-head">
              <h2>Comprobante · Pedido #{{ pComp.id }}</h2>
              <button class="btn-icon" (click)="cerrarComprobante()" title="Cerrar">✕</button>
            </header>
            <div class="comp-body">
              <img [src]="pComp.pago!.comprobante_url!" alt="Comprobante de pago">
            </div>
            <div class="comp-meta text-muted small">
              Metodo: {{ pComp.pago!.metodo_pago }} · Monto: S/ {{ pComp.pago!.monto | number:'1.2-2' }} · Estado: {{ pComp.pago!.estado_pago }}
            </div>
            <div class="comp-actions">
              <a class="btn btn-secondary btn-sm" [href]="pComp.pago!.comprobante_url!" target="_blank" rel="noopener noreferrer">Abrir en pestaña ↗</a>
              @if (pComp.estado_pedido === 'pendiente') {
                <button class="btn btn-primary btn-sm" (click)="confirmarPago(pComp); cerrarComprobante()">✓ Confirmar pago</button>
              }
              <button class="btn btn-secondary btn-sm" (click)="cerrarComprobante()">Cerrar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./pedido-list.component.scss'],
})
export class PedidoListComponent implements OnInit {
  private pedidoSvc = inject(PedidoService);
  private toast = inject(ToastService);

  pedidos = signal<Pedido[]>([]);
  loading = signal(true);
  total = signal(0);
  pagina = signal(1);
  ultimaPagina = signal(1);

  buscar = '';
  filtroEstado = signal<EstadoPedido | ''>('');
  desde = '';
  hasta = '';
  cerrados = signal<string[]>([]);
  comprobanteDe = signal<Pedido | null>(null);
  actualizandoId = signal<number | null>(null);

  private buscarTimer: ReturnType<typeof setTimeout> | null = null;

  grupos = computed<GrupoDia[]>(() => {
    const map = new Map<string, Pedido[]>();
    for (const p of this.pedidos()) {
      const clave = (p.fecha_pedido ?? '').slice(0, 10);
      if (!map.has(clave)) map.set(clave, []);
      map.get(clave)!.push(p);
    }
    return [...map.entries()].map(([clave, pedidos]) => ({
      clave,
      label: this.labelDia(clave),
      pedidos,
    }));
  });

  ngOnInit(): void {
    this.cargar();
  }

  onFiltro(): void {
    this.pagina.set(1);
    this.cargar();
  }

  onBuscar(): void {
    if (this.buscarTimer) clearTimeout(this.buscarTimer);
    this.buscarTimer = setTimeout(() => {
      this.pagina.set(1);
      this.cargar();
    }, 350);
  }

  toggleChip(estado: EstadoPedido): void {
    this.filtroEstado.set(this.filtroEstado() === estado ? '' : estado);
    this.onFiltro();
  }

  limpiarFiltros(): void {
    this.buscar = '';
    this.filtroEstado.set('');
    this.desde = '';
    this.hasta = '';
    this.pagina.set(1);
    this.cargar();
  }

  cambiarPagina(p: number): void {
    this.pagina.set(p);
    this.cargar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleGrupo(clave: string): void {
    this.cerrados.update((list) =>
      list.includes(clave) ? list.filter((c) => c !== clave) : [...list, clave]
    );
  }

  sumaDia(g: GrupoDia): number {
    return g.pedidos.reduce((acc, p) => acc + Number(p.total ?? 0), 0);
  }

  cargar(): void {
    this.loading.set(true);
    this.pedidoSvc
      .listarAdmin({
        estado_pedido: this.filtroEstado(),
        buscar: this.buscar || undefined,
        desde: this.desde || undefined,
        hasta: this.hasta || undefined,
        page: this.pagina(),
        per_page: 25,
      })
      .subscribe({
        next: (res) => {
          this.pedidos.set(res.data ?? []);
          this.total.set(res.meta?.total ?? 0);
          this.ultimaPagina.set(res.meta?.last_page ?? 1);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  cambiarEstado(p: Pedido, estado: EstadoPedido): void {
    this.actualizandoId.set(p.id);
    this.pedidoSvc.actualizarEstado(p.id, estado).subscribe({
      next: () => {
        this.actualizandoId.set(null);
        this.toast.success(`Pedido #${p.id} ahora esta "${estado}".`);
        this.cargar();
      },
      error: (err) => {
        this.actualizandoId.set(null);
        this.toast.error(err.error?.message ?? 'Error al actualizar.');
      },
    });
  }

  confirmarPago(p: Pedido): void {
    this.actualizandoId.set(p.id);
    this.pedidoSvc.actualizarEstado(p.id, 'pagado').subscribe({
      next: () => {
        this.actualizandoId.set(null);
        this.toast.success(`Pago del pedido #${p.id} confirmado.`);
        this.cargar();
      },
      error: (err) => {
        this.actualizandoId.set(null);
        this.toast.error(err.error?.message ?? 'Error al confirmar pago.');
      },
    });
  }

  verComprobante(p: Pedido): void {
    this.comprobanteDe.set(p);
  }

  cerrarComprobante(): void {
    this.comprobanteDe.set(null);
  }

  waLink(p: Pedido): string {
    const digits = (p.telefono ?? '').replace(/\D/g, '');
    let num = digits;
    if (digits.length === 9) num = '51' + digits;
    else if (digits.length === 10 && digits.startsWith('0')) num = '51' + digits.slice(1);
    const nombre = p.cliente?.nombres?.split(' ')?.[0] ?? '';
    const msg = `Hola${nombre ? ' ' + nombre : ''}! Somos Hancco Artesanias. Te escribimos por tu pedido #${p.id} (S/ ${p.total}) para coordinar el envio.`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }

  iconoMetodo(m?: string): string {
    return (
      {
        yape: '📱',
        contraentrega: '🚚',
        tarjeta: '💳',
        transferencia: '🏦',
        plin: '📲',
      } as Record<string, string>
    )[m ?? ''] ?? '❔';
  }

  private labelDia(clave: string): string {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    const hoyKey = `${yyyy}-${mm}-${dd}`;
    const ayer = new Date(hoy.getTime() - 86400000);
    const ayerKey = `${ayer.getFullYear()}-${String(ayer.getMonth() + 1).padStart(2, '0')}-${String(ayer.getDate()).padStart(2, '0')}`;

    if (clave === hoyKey) return 'Hoy';
    if (clave === ayerKey) return 'Ayer';

    const [y, m, d] = clave.split('-').map(Number);
    const fecha = new Date(y, (m ?? 1) - 1, d ?? 1);
    return fecha.toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }
}
