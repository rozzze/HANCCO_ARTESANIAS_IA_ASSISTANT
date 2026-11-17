import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="footer-accent" aria-hidden="true"></div>
      <div class="container">
        <div class="grid">
          <div class="footer-brand">
            <div class="brand-row">
              <span class="brand-mark">H</span>
              <span class="brand-name">Hancco Artesanias</span>
            </div>
            <p class="text-muted">
              Ropa tradicional de todo tipo, confeccionada con telas de calidad en Arequipa.
            </p>
          </div>

          <div>
            <h4>Tienda</h4>
            <ul>
              <li><a routerLink="/catalogo">Catalogo</a></li>
              <li><a routerLink="/nosotros">Nosotros</a></li>
              <li><a routerLink="/auth/register">Crear cuenta</a></li>
            </ul>
          </div>

          <div>
            <h4>Contacto</h4>
            <ul class="contact-list">
              <li>
                <svg class="ci" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6 8.5-6"/></svg>
                hanccoartesanias&#64;gmail.com
              </li>
              <li>
                <svg class="ci" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/></svg>
                +51 982 287 068
              </li>
              <li>
                <svg class="ci" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
                Arequipa, Peru &mdash; a pasos de la Plaza de Armas
              </li>
            </ul>
          </div>
        </div>

        <div class="bottom">
          <span class="text-muted">&copy; {{ year }} Hancco Artesanias. Todos los derechos reservados.</span>
        </div>
      </div>
    </footer>
  `,
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  year = new Date().getFullYear();
}