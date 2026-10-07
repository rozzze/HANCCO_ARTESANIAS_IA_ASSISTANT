import { Component, OnInit, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CategoriaService } from '../../core/services/categoria.service';
import { Categoria } from '../../core/models/categoria.model';
import { Producto } from '../../core/models/producto.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-categoria-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  template: `
    <div class="container page">
      @if (loading()) {
        <div class="loading-overlay"><span class="spinner spinner-lg"></span></div>
      } @else {
        <header class="cat-head">
          <span class="eyebrow">Categoria</span>
          <h1>{{ categoria()?.nombre ?? slug }}</h1>
          @if (categoria()?.descripcion) {
            <p class="text-muted">{{ categoria()?.descripcion }}</p>
          }
          <p class="text-muted small">{{ total() }} productos</p>
        </header>

        @if (productos().length > 0) {
          <div class="grid grid-4">
            @for (prod of productos(); track prod.id) {
              <app-product-card [producto]="prod"></app-product-card>
            }
          </div>
        } @else {
          <p class="text-center text-muted">No hay productos en esta categoria aun.</p>
        }
      }
    </div>
  `,
  styleUrls: ['./categoria-detalle.component.scss'],
})
export class CategoriaDetalleComponent implements OnInit {
  private categoriaSvc = inject(CategoriaService);
  private route = inject(ActivatedRoute);

  @Input() slug?: string;

  categoria = signal<Categoria | null>(null);
  productos = signal<Producto[]>([]);
  total = signal(0);
  loading = signal(true);

  ngOnInit(): void {
    const catSlug = this.slug ?? this.route.snapshot.paramMap.get('slug') ?? '';
    this.cargar(catSlug);
  }

  private cargar(slug: string): void {
    this.categoriaSvc.productosPorCategoria(slug).subscribe({
      next: (res: any) => {
        if (res.data.length > 0) {
          const primerProd = res.data[0];
          this.categoria.set(primerProd.categoria);
        }
        this.productos.set(res.data);
        this.total.set(res.meta?.total ?? res.data.length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}