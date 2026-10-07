import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../../core/services/pedido.service';
import { ToastService } from '../../../core/services/toast.service';
import { Pedido, EstadoPedido } from '../../../core/models/pedido.model';

@Component({
  selector: 'app-pedido-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-head">
        <label class="filter-label" for="filtro-estado">Estado</label>
        <select id="filtro-estado" [(ngModel)]="filtroEstado" (ngModelChange)="cargar()" class="form-control filter">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="pagado">Pagados</option>
          <option value="enviado">Enviados</option>
          <option value="entregado">Entregados</option>
          <option value="cancelado">Cancelados</option>
        </select>
      </header>

      @if (loading()) {
        <div class="loading-overlay"><span class="spinner spinner-lg"></span></div>
      } @else if (pedidos().length > 0) {
        <div class="list">
          @for (p of pedidos(); track p.id) {
            <div class="pedido card">
              <div class="ped-top">
                <div>
                  <strong>Pedido #{{ p.id }}</strong>
                  <span class="meta">{{ p.cliente?.nombres }} · {{ p.fecha_pedido | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="ped-amount">S/ {{ p.total | number:'1.2-2' }}</div>
              </div>

              <div class="ped-items">
                @for (d of p.detalles ?? []; track d.id) {
                  <div class="ped-item">
                    <span>{{ d.cantidad }}x {{ d.producto?.nombre }}@if (d.talla) { <em class="ped-talla">(Talla {{ d.talla }})</em>}</span>
                    <span>S/ {{ d.subtotal | number:'1.2-2' }}</span>
                  </div>
                }
              </div>

              @if (p.direccion_envio) {
                <div class="ped-addr">📍 {{ p.direccion_envio }}</div>
              }

              <div class="ped-actions">
                <select [ngModel]="p.estado_pedido" (ngModelChange)="actualizarEstado(p, $event)" class="form-control">
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                  <option value="enviado">Enviado</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
                <span class="badge" [class.badge-ok]="p.estado_pedido === 'pagado' || p.estado_pedido === 'entregado'">
                  {{ p.estado_pedido }}
                </span>
              </div>
            </div>
          }
        </div>
      } @else {
        <p class="text-center text-muted">No hay pedidos.</p>
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
  filtroEstado: EstadoPedido | '' = '';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.pedidoSvc.listarAdmin({ estado_pedido: this.filtroEstado || undefined }).subscribe({
      next: (res: any) => {
        this.pedidos.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  actualizarEstado(p: Pedido, estado: EstadoPedido): void {
    this.pedidoSvc.actualizarEstado(p.id, estado).subscribe({
      next: () => {
        p.estado_pedido = estado;
        this.toast.success(`Pedido #${p.id} actualizado a "${estado}".`);
      },
      error: (err) => this.toast.error(err.error?.message ?? 'Error al actualizar.'),
    });
  }
}