import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'catalogo',
    loadComponent: () => import('./features/catalogo/catalogo.component').then((m) => m.CatalogoComponent),
  },
  {
    path: 'producto/:id',
    loadComponent: () => import('./features/catalogo/producto-detalle.component').then((m) => m.ProductoDetalleComponent),
  },
  {
    path: 'categoria/:slug',
    loadComponent: () => import('./features/categorias/categoria-detalle.component').then((m) => m.CategoriaDetalleComponent),
  },
  {
    path: 'nosotros',
    loadComponent: () => import('./features/nosotros/nosotros.component').then((m) => m.NosotrosComponent),
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'carrito',
    canActivate: [authGuard],
    loadComponent: () => import('./features/carrito/carrito.component').then((m) => m.CarritoComponent),
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./features/checkout/checkout.component').then((m) => m.CheckoutComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/dashboard/dashboard-home.component').then((m) => m.DashboardHomeComponent),
      },
      {
        path: 'productos',
        loadComponent: () => import('./features/admin/productos/list/producto-list.component').then((m) => m.ProductoListComponent),
      },
      {
        path: 'productos/nuevo',
        loadComponent: () => import('./features/admin/productos/form/producto-form.component').then((m) => m.ProductoFormComponent),
      },
      {
        path: 'productos/:id/editar',
        loadComponent: () => import('./features/admin/productos/form/producto-form.component').then((m) => m.ProductoFormComponent),
      },
      {
        path: 'productos/:id/imagenes',
        loadComponent: () => import('./features/admin/productos/imagen-ia/imagen-ia.component').then((m) => m.ImagenIaComponent),
      },
      {
        path: 'categorias',
        loadComponent: () => import('./features/admin/categorias/categoria-list.component').then((m) => m.CategoriaListComponent),
      },
      {
        path: 'maniquies',
        loadComponent: () => import('./features/admin/maniquies/maniqui-list.component').then((m) => m.ManiquiListComponent),
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./features/admin/pedidos/pedido-list.component').then((m) => m.PedidoListComponent),
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/admin/usuarios/usuario-list.component').then((m) => m.UsuarioListComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];