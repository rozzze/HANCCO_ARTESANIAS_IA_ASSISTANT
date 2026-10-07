import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CarritoService } from '../../../core/services/carrito.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <div class="container header-inner">
        <a routerLink="/" class="brand">
          <span class="brand-mark">H</span>
          <span class="brand-name">Hancco</span>
          <span class="brand-tag">Artesanias</span>
        </a>

        <nav class="nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Inicio</a>
          <a routerLink="/catalogo" routerLinkActive="active">Catalogo</a>
          <a routerLink="/nosotros" routerLinkActive="active">Nosotros</a>
          @if (isAdmin()) {
            <a routerLink="/admin" routerLinkActive="active">Admin</a>
          }
        </nav>

        <div class="actions">
          <a routerLink="/carrito" class="cart-btn" title="Mi carrito">
            <span class="cart-icon">🛒</span>
            @if (cantidadCarrito() > 0) {
              <span class="cart-badge">{{ cantidadCarrito() }}</span>
            }
          </a>

          @if (isLoggedIn()) {
            <div class="user-menu">
              <span class="user-name">Hola, {{ usuario()?.nombres?.split(' ')?.[0] }}</span>
              <button class="btn btn-secondary btn-sm" (click)="logout()">Salir</button>
            </div>
          } @else {
            <a routerLink="/auth/login" class="btn btn-primary btn-sm">Ingresar</a>
          }
        </div>
      </div>
    </header>
  `,
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  private auth = inject(AuthService);
  private carritoSvc = inject(CarritoService);
  private toast = inject(ToastService);

  usuario = this.auth.usuario;
  isLoggedIn = this.auth.isLoggedIn;
  isAdmin = this.auth.isAdmin;
  cantidadCarrito = this.carritoSvc.cantidadItems;

  logout(): void {
    this.auth.logout();
    this.toast.info('Sesion cerrada.');
  }
}