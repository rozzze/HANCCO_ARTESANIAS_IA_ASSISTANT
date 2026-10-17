import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { StatsService } from '../../../core/services/stats.service';
import { ToastService } from '../../../core/services/toast.service';
import { Stats } from '../../../core/models/stats.model';

interface Barra {
  x: number;
  y: number;
  w: number;
  h: number;
  fecha: string;
  total: number;
  label: string;
  tooltip: string;
  mostrarLabel: boolean;
  esHoy: boolean;
}

interface Acceso {
  icon: string;
  title: string;
  sub: string;
  link: string;
  accent: string;
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home">
      <section class="welcome">
        <div>
          <h2>Hola, {{ nombre() }} 👋</h2>
          <p class="text-muted">Asi va tu tienda hoy.</p>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" (click)="cargar()" [disabled]="loading()">
          @if (loading()) { <span class="spinner"></span> } @else { ↻ } Actualizar
        </button>
      </section>

      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      }

      <!-- KPIs -->
      <div class="kpi-grid">
        <a routerLink="/admin/pedidos" class="kpi kpi-ventas">
          <span class="kpi-label">Ventas del mes</span>
          <strong class="kpi-value">S/ {{ stats()?.ventas_mes?.total ?? 0 | number:'1.2-2' }}</strong>
          <span class="kpi-sub">
            {{ stats()?.ventas_mes?.cantidad ?? 0 }} pedido(s)
            @if (delta() !== null) {
              <span class="delta" [class.up]="delta()! > 0" [class.down]="delta()! < 0">
                {{ delta()! > 0 ? '▲' : delta()! < 0 ? '▼' : '=' }} {{ absDelta() }}%
              </span>
            } @else {
              <span class="delta neutro">sin base previa</span>
            }
          </span>
        </a>

        <a routerLink="/admin/pedidos" class="kpi">
          <span class="kpi-label">Pedidos pendientes</span>
          <strong class="kpi-value">{{ stats()?.pedidos_pendientes ?? '—' }}</strong>
          <span class="kpi-sub">por atender</span>
        </a>

        <a routerLink="/admin/pedidos" class="kpi" [class.alerta]="(stats()?.comprobantes_pendientes ?? 0) > 0">
          <span class="kpi-label">Comprobantes por confirmar</span>
          <strong class="kpi-value">{{ stats()?.comprobantes_pendientes ?? '—' }}</strong>
          <span class="kpi-sub">Yape esperando revision</span>
        </a>

        <a routerLink="/admin/productos" class="kpi" [class.alerta]="(stats()?.productos_stock_bajo ?? 0) > 0">
          <span class="kpi-label">Productos con stock bajo</span>
          <strong class="kpi-value">{{ stats()?.productos_stock_bajo ?? '—' }}</strong>
          <span class="kpi-sub">3 unidades o menos</span>
        </a>
      </div>

      @if (loading()) {
        <div class="loading-overlay"><span class="spinner spinner-lg"></span></div>
      } @else if (stats()) {
        <!-- Grafico + stock critico -->
        <div class="row-2">
          <section class="panel panel-chart">
            <header class="panel-head">
              <h3>Ingresos · ultimos 14 dias</h3>
              <span class="panel-total">S/ {{ total14() | number:'1.2-2' }}</span>
            </header>

            <svg class="chart" [attr.viewBox]="'0 0 ' + chart.w + ' ' + chart.h" role="img" aria-label="Ingresos de los ultimos 14 dias">
              <line class="chart-base" [attr.x1]="0" [attr.x2]="chart.w" [attr.y1]="chart.h - chart.padBottom + 6" [attr.y2]="chart.h - chart.padBottom + 6" />
              @for (b of barras(); track b.fecha) {
                <g>
                  <rect
                    class="bar"
                    [class.hoy]="b.esHoy"
                    [attr.x]="b.x"
                    [attr.y]="b.y"
                    [attr.width]="b.w"
                    [attr.height]="b.h"
                    rx="3"
                  >
                    <title>{{ b.tooltip }}</title>
                  </rect>
                  @if (b.mostrarLabel) {
                    <text class="bar-label" [attr.x]="b.x + b.w / 2" [attr.y]="chart.h - chart.padBottom + 20" text-anchor="middle">{{ b.label }}</text>
                  }
                </g>
              }
            </svg>
          </section>

          <section class="panel">
            <header class="panel-head">
              <h3>Stock critico</h3>
              @if ((stats()?.stock_critico?.length ?? 0) > 0) {
                <span class="panel-badge alerta">{{ stats()?.stock_critico?.length }}</span>
              }
            </header>

            @if ((stats()?.stock_critico?.length ?? 0) === 0) {
              <p class="panel-empty text-muted">Todo el catalogo tiene stock saludable. 👍</p>
            } @else {
              <ul class="stock-list">
                @for (p of stats()!.stock_critico; track p.id) {
                  <li>
                    @if (p.imagen_principal_url) {
                      <img [src]="p.imagen_principal_url" [alt]="p.nombre" loading="lazy">
                    } @else {
                      <span class="thumb-fallback"></span>
                    }
                    <div class="stock-info">
                      <strong>{{ p.nombre }}</strong>
                      <small class="text-muted">/{{ p.slug }}</small>
                    </div>
                    <span class="stock-num" [class.agotado]="p.stock_disponible === 0">{{ p.stock_disponible }}</span>
                    <a [routerLink]="['/admin/productos', p.id, 'editar']" class="btn btn-secondary btn-sm" title="Editar stock">Editar</a>
                  </li>
                }
              </ul>
            }
          </section>
        </div>

        <!-- Top productos + accesos -->
        <div class="row-2">
          <section class="panel">
            <header class="panel-head">
              <h3>Top vendidos · 30 dias</h3>
            </header>
            @if ((stats()?.top_productos?.length ?? 0) === 0) {
              <p class="panel-empty text-muted">Aun no hay ventas en los ultimos 30 dias.</p>
            } @else {
              <ol class="top-list">
                @for (t of stats()!.top_productos; track t.producto_id; let i = $index) {
                  <li>
                    <span class="rank">{{ i + 1 }}</span>
                    <div class="top-info">
                      <strong>{{ t.nombre }}</strong>
                      <small class="text-muted">{{ t.cantidad }} unidad(es)</small>
                    </div>
                    <span class="top-total">S/ {{ t.total | number:'1.2-2' }}</span>
                  </li>
                }
              </ol>
            }
          </section>

          <section class="panel">
            <header class="panel-head">
              <h3>Accesos rapidos</h3>
            </header>
            <div class="accesos">
              @for (q of accesos; track q.link) {
                <a [routerLink]="q.link" class="acceso" [style.--accent]="q.accent">
                  <span class="acceso-icon">{{ q.icon }}</span>
                  <span class="acceso-txt">
                    <strong>{{ q.title }}</strong>
                    <small>{{ q.sub }}</small>
                  </span>
                  <span class="acceso-arrow">→</span>
                </a>
              }
            </div>
          </section>
        </div>

        <!-- Atajos de accion -->
        <div class="tips-grid">
          <a routerLink="/admin/productos/nuevo" class="tip"><span class="tip-icon">➕</span><span>Crear producto</span></a>
          <a routerLink="/admin/categorias" class="tip"><span class="tip-icon">🏷️</span><span>Nueva categoria</span></a>
          <a routerLink="/admin/pedidos" class="tip"><span class="tip-icon">🛒</span><span>Revisar pedidos</span></a>
          <a routerLink="/" class="tip"><span class="tip-icon">🛍️</span><span>Ver tienda</span></a>
        </div>
      }
    </div>
  `,
  styleUrls: ['./dashboard-home.component.scss'],
})
export class DashboardHomeComponent implements OnInit {
  private auth = inject(AuthService);
  private statsSvc = inject(StatsService);
  private toast = inject(ToastService);

  nombre = computed(() => this.auth.usuario()?.nombres?.split(' ')?.[0] ?? 'Admin');

  stats = signal<Stats | null>(null);
  loading = signal(true);
  error = signal('');

  readonly chart = { w: 560, h: 190, padX: 6, padTop: 14, padBottom: 30 };

  delta = computed(() => this.stats()?.ventas_mes?.delta_pct ?? null);
  absDelta = computed(() => Math.abs(this.delta() ?? 0).toFixed(1));

  total14 = computed(() =>
    (this.stats()?.ingresos_14d ?? []).reduce((acc, p) => acc + p.total, 0)
  );

  barras = computed<Barra[]>(() => {
    const data = this.stats()?.ingresos_14d ?? [];
    if (!data.length) return [];

    const max = Math.max(...data.map((d) => d.total), 1);
    const areaH = this.chart.h - this.chart.padTop - this.chart.padBottom;
    const slot = (this.chart.w - this.chart.padX * 2) / data.length;
    const bw = Math.max(slot - 7, 4);

    return data.map((d, i) => {
      const h = Math.max((d.total / max) * areaH, 3);
      return {
        x: this.chart.padX + i * slot + (slot - bw) / 2,
        y: this.chart.padTop + areaH - h,
        w: bw,
        h,
        fecha: d.fecha,
        total: d.total,
        label: this.fmtFechaCorta(d.fecha),
        tooltip: `${this.fmtFechaLarga(d.fecha)} — S/ ${d.total.toFixed(2)}`,
        mostrarLabel: i % 3 === 0 || i === data.length - 1,
        esHoy: i === data.length - 1,
      };
    });
  });

  readonly accesos: Acceso[] = [
    { icon: '📦', title: 'Productos', sub: 'Gestiona el catalogo', link: '/admin/productos', accent: '#8B5A2B' },
    { icon: '🛒', title: 'Pedidos', sub: 'Revisa y actualiza estados', link: '/admin/pedidos', accent: '#C75B39' },
    { icon: '🏷️', title: 'Categorias', sub: 'Organiza el catalogo', link: '/admin/categorias', accent: '#4A7C59' },
    { icon: '👥', title: 'Usuarios', sub: 'Administra roles y acceso', link: '/admin/usuarios', accent: '#2C5B7C' },
  ];

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set('');

    this.statsSvc.obtener().subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'No pudimos cargar las metricas.');
      },
    });
  }

  private fmtFechaCorta(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}`;
  }

  private fmtFechaLarga(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-PE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  }
}
