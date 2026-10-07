import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

interface NavItem {
  label: string;
  icon: string;
  link: string;
  exact?: boolean;
}

interface NavSection {
  titulo: string;
  items: NavItem[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  host: {
    '(document:keydown.escape)': 'cerrarDrawer()',
  },
  template: `
    <div class="admin-shell" [class.drawer-open]="drawerOpen()">
      <div class="drawer-backdrop" (click)="cerrarDrawer()"></div>

      <aside class="sidebar">
        <div class="sidebar-head">
          <a routerLink="/" class="brand">
            <span class="brand-mark">H</span>
            <span class="brand-text">
              <strong>Hancco</strong>
              <small>Panel Admin</small>
            </span>
          </a>
          <button class="drawer-close" (click)="cerrarDrawer()" aria-label="Cerrar menu">✕</button>
        </div>

        <nav class="sidebar-nav">
          @for (seccion of secciones; track seccion.titulo) {
            <div class="nav-section">
              <span class="nav-section-title">{{ seccion.titulo }}</span>
              @for (item of seccion.items; track item.link) {
                <a
                  [routerLink]="item.link"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="item.exact ? { exact: true } : { exact: false }"
                  (click)="cerrarDrawer()"
                >
                  <span class="nav-icon">{{ item.icon }}</span>
                  <span class="nav-label">{{ item.label }}</span>
                </a>
              }
            </div>
          }
        </nav>

        <div class="sidebar-foot">
          <div class="user-chip">
            <span class="user-avatar">{{ iniciales() }}</span>
            <span class="user-meta">
              <strong>{{ nombreUsuario() }}</strong>
              <small>Administrador</small>
            </span>
          </div>
          <a routerLink="/" class="btn btn-secondary btn-sm btn-block" (click)="cerrarDrawer()">🛍️ Ver tienda</a>
          <button class="btn btn-logout btn-sm btn-block" (click)="logout()">Cerrar sesion</button>
        </div>
      </aside>

      <div class="admin-main">
        <header class="topbar">
          <button class="hamburger" (click)="abrirDrawer()" aria-label="Abrir menu">
            <span></span><span></span><span></span>
          </button>
          <h1 class="topbar-title">{{ titulo() }}</h1>
          <div class="topbar-right">
            <span class="topbar-user">
              <span class="user-avatar sm">{{ iniciales() }}</span>
              <span class="topbar-user-name">{{ nombreUsuario() }}</span>
            </span>
          </div>
        </header>

        <div class="admin-content">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  drawerOpen = signal(false);
  urlActual = signal(this.router.url);

  readonly secciones: NavSection[] = [
    {
      titulo: 'General',
      items: [{ label: 'Dashboard', icon: '📊', link: '/admin', exact: true }],
    },
    {
      titulo: 'Catalogo',
      items: [
        { label: 'Productos', icon: '📦', link: '/admin/productos' },
        { label: 'Categorias', icon: '🏷️', link: '/admin/categorias' },
        { label: 'Maniquies', icon: '🎭', link: '/admin/maniquies' },
      ],
    },
    {
      titulo: 'Ventas',
      items: [{ label: 'Pedidos', icon: '🛒', link: '/admin/pedidos' }],
    },
    {
      titulo: 'Sistema',
      items: [{ label: 'Usuarios', icon: '👥', link: '/admin/usuarios' }],
    },
  ];

  private readonly mapaTitulos: { regex: RegExp; titulo: string }[] = [
    { regex: /^\/admin\/productos\/\d+\/imagenes/, titulo: 'Imagenes de producto' },
    { regex: /^\/admin\/productos\/\d+\/editar/, titulo: 'Editar producto' },
    { regex: /^\/admin\/productos\/nuevo/, titulo: 'Nuevo producto' },
    { regex: /^\/admin\/productos/, titulo: 'Productos' },
    { regex: /^\/admin\/categorias/, titulo: 'Categorias' },
    { regex: /^\/admin\/maniquies/, titulo: 'Maniquies' },
    { regex: /^\/admin\/pedidos/, titulo: 'Pedidos' },
    { regex: /^\/admin\/usuarios/, titulo: 'Usuarios' },
    { regex: /^\/admin\/?$/, titulo: 'Dashboard' },
  ];

  titulo = computed(() => {
    const url = this.urlActual();
    const match = this.mapaTitulos.find((m) => m.regex.test(url));
    return match?.titulo ?? 'Panel Admin';
  });

  nombreUsuario = computed(() => this.auth.usuario()?.nombres ?? 'Admin');

  iniciales = computed(() => {
    const partes = this.nombreUsuario().trim().split(/\s+/);
    return (partes[0]?.[0] ?? 'A').concat(partes[1]?.[0] ?? '').toUpperCase();
  });

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.urlActual.set((e as NavigationEnd).urlAfterRedirects);
        this.drawerOpen.set(false);
      });
  }

  abrirDrawer(): void {
    this.drawerOpen.set(true);
  }

  cerrarDrawer(): void {
    this.drawerOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.toast.info('Sesion cerrada.');
  }
}
