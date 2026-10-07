import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="container">
        <div class="grid">
          <div>
            <h3 class="brand">Hancco Artesanias</h3>
            <p class="text-muted">
              Prendas de fibra de alpaca tejidas a mano con tecnicas tradicionales andinas.
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
            <ul>
              <li>contacto&#64;hancco.com</li>
              <li>+51 999 888 777</li>
              <li>Cusco, Peru</li>
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