import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastComponent],
  template: `
    @if (!esAdmin()) {
      <app-header></app-header>
    }
    <main [class.admin-mode]="esAdmin()"><router-outlet></router-outlet></main>
    @if (!esAdmin()) {
      <app-footer></app-footer>
    }
    <app-toast></app-toast>
  `,
  styles: [`
    main { min-height: calc(100vh - 140px); }
    main.admin-mode { min-height: 100vh; }
  `],
})
export class AppComponent {
  private router = inject(Router);

  private readonly url = signal(this.router.url);
  esAdmin = computed(() => this.url().startsWith('/admin'));

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => this.url.set((e as NavigationEnd).urlAfterRedirects));
  }
}
