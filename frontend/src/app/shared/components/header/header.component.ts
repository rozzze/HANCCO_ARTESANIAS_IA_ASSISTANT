import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CarritoService } from '../../../core/services/carrito.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <div class="container header-inner">
        <a routerLink="/" class="brand">
          <span class="brand-mark">H</span>
          <span class="brand-text">
            <span class="brand-name">Hancco</span>
            <span class="brand-tag">Artesanias</span>
          </span>
        </a>

        <nav class="nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Inicio</a>
          <a routerLink="/catalogo" routerLinkActive="active">Catalogo</a>
          <a routerLink="/nosotros" routerLinkActive="active">Nosotros</a>
          @if (isLoggedIn()) {
            <a routerLink="/mis-pedidos" routerLinkActive="active">Mis pedidos</a>
          }
          @if (isAdmin()) {
            <a routerLink="/admin" routerLinkActive="active">Admin</a>
          }
        </nav>

        <div class="actions">
          <a routerLink="/carrito" class="cart-btn" title="Mi carrito" aria-label="Mi carrito">
            <svg class="cart-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 4h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.2"/>
              <circle cx="9.5" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>
            </svg>
            @if (cantidadCarrito() > 0) {
              <span class="cart-badge">{{ cantidadCarrito() }}</span>
            }
          </a>

          @if (isLoggedIn()) {
            <div class="user-menu">
              <a routerLink="/mi-perfil" routerLinkActive="active" class="user-name user-link" title="Mi perfil">
                <svg class="user-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0"/>
                </svg>
                <span>Hola, {{ usuario()?.nombres?.split(' ')?.[0] }}</span>
              </a>
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