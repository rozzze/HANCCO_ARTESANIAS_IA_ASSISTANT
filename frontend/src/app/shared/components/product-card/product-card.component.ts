import { Component, ChangeDetectionStrategy, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Producto } from '../../../core/models/producto.model';
import { CheckoutService } from '../../../core/services/checkout.service';
import { buildConsultaLink } from '../../../core/utils/whatsapp.util';

@Component({
  selector: 'app-product-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <article class="card product-card">
      <a [routerLink]="['/producto', producto.id]" class="card-link" [attr.aria-label]="producto.nombre">
        <div class="image-wrap">
          @if (producto.imagen_principal_url) {
            <img [src]="producto.imagen_principal_url" [alt]="producto.nombre" loading="lazy" decoding="async">
          } @else {
            <div class="no-image">Sin imagen</div>
          }
          @if (producto.stock_disponible === 0) {
            <span class="badge out">Agotado</span>
          }
        </div>
      </a>

      <div class="info">
        <a [routerLink]="['/producto', producto.id]" class="name-link">
          <span class="category">{{ producto.categoria?.nombre ?? producto.color }}</span>
          <h3 class="name">{{ producto.nombre }}</h3>
        </a>

        <div class="price-row">
          <span class="price">S/ {{ producto.precio_venta | number:'1.2-2' }}</span>
          @if (producto.material) {
            <span class="material">{{ producto.material }}</span>
          }
        </div>

        @if (waLink()) {
          <div class="card-actions">
            <a
              class="btn btn-wa btn-sm btn-block"
              [href]="waLink()"
              target="_blank"
              rel="noopener noreferrer"
              title="Consultar por WhatsApp"
            >
              <svg class="wa-ico" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.1L4 20zM9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 1a5 5 0 0 1-2.9-2.9l1-1-1-2L9 8.5z"/>
              </svg>
              Consultar
            </a>
          </div>
        }
      </div>
    </article>
  `,
  styleUrls: ['./product-card.component.scss'],
})
export class ProductCardComponent implements OnInit {
  private checkoutSvc = inject(CheckoutService);

  @Input({ required: true }) producto!: Producto;

  ngOnInit(): void {
    if (!this.checkoutSvc.config()) {
      this.checkoutSvc.obtenerConfig().subscribe({ error: () => {} });
    }
  }

  waLink(): string {
    const numero = this.checkoutSvc.config()?.whatsapp_tienda ?? '';
    if (!numero || !this.producto) return '';
    return buildConsultaLink(this.producto, numero);
  }
}
