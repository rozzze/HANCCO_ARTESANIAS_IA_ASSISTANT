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
              <li><span class="ci" aria-hidden="true">&#9993;</span> hanccoartesanias&#64;gmail.com</li>
              <li><span class="ci" aria-hidden="true">&#9742;</span> +51 982 287 068</li>
              <li><span class="ci" aria-hidden="true">&#128205;</span> Arequipa, Peru &mdash; a pasos de la Plaza de Armas</li>
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