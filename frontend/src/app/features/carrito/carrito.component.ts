import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../../core/services/carrito.service';
import { ToastService } from '../../core/services/toast.service';
import { Carrito, DetalleCarrito } from '../../core/models/carrito.model';

@Component({
  selector: 'app-carrito',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container page">
      <h1>Tu carrito</h1>

      @if (loading()) {
        <div class="loading-overlay"><span class="spinner spinner-lg"></span></div>
      } @else {
        @if (carrito(); as car) {
          @if (car.detalles?.length) {
          <div class="layout">
            <div class="items">
              @for (item of car.detalles; track item.id) {
                <div class="item card">
                  <div class="img-wrap">
                    @if (item.producto?.imagen_principal_url) {
                      <img [src]="item.producto?.imagen_principal_url" [alt]="item.producto?.nombre">
                    } @else {
                      <div class="no-image">Sin imagen</div>
                    }
                  </div>
                  <div class="info">
                    <a [routerLink]="['/producto', item.producto_id]" class="name">{{ item.producto?.nombre }}</a>
                    <span class="meta">{{ item.producto?.color }} · Talla {{ item.talla }}</span>
                    <span class="unit-price">S/ {{ item.producto?.precio_venta | number:'1.2-2' }} c/u</span>
                  </div>
                  <div class="qty">
                    <button (click)="actualizar(item, item.cantidad - 1)" [disabled]="item.cantidad <= 1">−</button>
                    <span>{{ item.cantidad }}</span>
                    <button (click)="actualizar(item, item.cantidad + 1)" [disabled]="item.cantidad >= (item.stock_talla ?? 0)">+</button>
                  </div>
                  <div class="subtotal">S/ {{ item.subtotal | number:'1.2-2' }}</div>
                  <button class="btn-remove" (click)="eliminar(item)" title="Eliminar">✕</button>
                </div>
              }
            </div>

            <aside class="summary">
              <h3>Resumen</h3>
              <div class="line"><span>Subtotal</span><span>S/ {{ car.total | number:'1.2-2' }}</span></div>
              <div class="line"><span>Envio</span><span class="text-muted">A coordinar</span></div>
              <div class="line total"><span>Total</span><span>S/ {{ car.total | number:'1.2-2' }}</span></div>

              <hr>

              @if (error()) {
                <div class="alert alert-error">{{ error() }}</div>
              }

              <button class="btn btn-primary btn-block" (click)="irCheckout()">
                Proceder al checkout →
              </button>
            </aside>
          </div>
        } @else {
            <div class="empty">
              <p class="text-muted">Tu carrito esta vacio.</p>
              <a routerLink="/catalogo" class="btn btn-primary">Explorar catalogo</a>
            </div>
          }
        }
      }
    </div>
  `,
  styleUrls: ['./carrito.component.scss'],
})
export class CarritoComponent implements OnInit {
  private carritoSvc = inject(CarritoService);
  private router = inject(Router);
  private toast = inject(ToastService);

  carrito = signal<Carrito | null>(null);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.carritoSvc.obtener().subscribe({
      next: (res) => {
        this.carrito.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  actualizar(item: DetalleCarrito, cantidad: number): void {
    if (cantidad < 1) return;
    this.carritoSvc.actualizarCantidad(item.id, cantidad).subscribe({
      next: (res) => this.carrito.set(res.data),
      error: (err) => {
        const msg = err.error?.message ?? 'Error al actualizar.';
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }

  eliminar(item: DetalleCarrito): void {
    this.carritoSvc.eliminar(item.id).subscribe({
      next: (res) => this.carrito.set(res.data),
    });
  }

  irCheckout(): void {
    this.router.navigate(['/checkout']);
  }
}