import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Producto } from '../../../core/models/producto.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a [routerLink]="['/producto', producto.id]" class="card product-card">
      <div class="image-wrap">
        @if (producto.imagen_principal_url) {
          <img [src]="producto.imagen_principal_url" [alt]="producto.nombre" loading="lazy">
        } @else {
          <div class="no-image">Sin imagen</div>
        }
        @if (producto.stock_disponible === 0) {
          <span class="badge out">Agotado</span>
        }
      </div>
      <div class="info">
        <span class="category">{{ producto.categoria?.nombre ?? producto.color }}</span>
        <h3 class="name">{{ producto.nombre }}</h3>
        <div class="price-row">
          <span class="price">S/ {{ producto.precio_venta | number:'1.2-2' }}</span>
          @if (producto.material) {
            <span class="material">{{ producto.material }}</span>
          }
        </div>
      </div>
    </a>
  `,
  styleUrls: ['./product-card.component.scss'],
})
export class ProductCardComponent {
  @Input({ required: true }) producto!: Producto;
}