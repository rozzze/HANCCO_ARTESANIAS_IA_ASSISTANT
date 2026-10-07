import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface QuickLink {
  icon: string;
  title: string;
  sub: string;
  link: string;
  accent: string;
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home">
      <section class="welcome">
        <h2>Hola, {{ nombre() }} 👋</h2>
        <p class="text-muted">Gestiona tu tienda desde un solo lugar.</p>
      </section>

      <div class="quick-grid">
        @for (q of quickLinks; track q.link) {
          <a [routerLink]="q.link" class="quick-card" [style.--accent]="q.accent">
            <span class="quick-icon">{{ q.icon }}</span>
            <span class="quick-body">
              <strong>{{ q.title }}</strong>
              <small>{{ q.sub }}</small>
            </span>
            <span class="quick-arrow">→</span>
          </a>
        }
      </div>

      <section class="tips">
        <h3>Atajos rapidos</h3>
        <div class="tips-grid">
          <a routerLink="/admin/productos/nuevo" class="tip">
            <span class="tip-icon">➕</span>
            <span>Crear producto</span>
          </a>
          <a routerLink="/admin/categorias" class="tip">
            <span class="tip-icon">🏷️</span>
            <span>Nueva categoria</span>
          </a>
          <a routerLink="/admin/pedidos" class="tip">
            <span class="tip-icon">🛒</span>
            <span>Revisar pedidos</span>
          </a>
          <a routerLink="/" class="tip">
            <span class="tip-icon">🛍️</span>
            <span>Ver tienda</span>
          </a>
        </div>
      </section>
    </div>
  `,
  styleUrls: ['./dashboard-home.component.scss'],
})
export class DashboardHomeComponent {
  private auth = inject(AuthService);

  nombre = computed(() => this.auth.usuario()?.nombres?.split(' ')?.[0] ?? 'Admin');

  readonly quickLinks: QuickLink[] = [
    { icon: '📦', title: 'Productos', sub: 'Gestiona el catalogo', link: '/admin/productos', accent: '#8B5A2B' },
    { icon: '🛒', title: 'Pedidos', sub: 'Revisa y actualiza estados', link: '/admin/pedidos', accent: '#C75B39' },
    { icon: '🏷️', title: 'Categorias', sub: 'Organiza el catalogo', link: '/admin/categorias', accent: '#4A7C59' },
    { icon: '👥', title: 'Usuarios', sub: 'Administra roles y acceso', link: '/admin/usuarios', accent: '#2C5B7C' },
  ];
}
