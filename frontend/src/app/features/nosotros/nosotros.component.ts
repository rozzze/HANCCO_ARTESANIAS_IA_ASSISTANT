import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-nosotros',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container page">
      <section class="hero-section">
        <span class="eyebrow">Nuestra Historia</span>
        <h1>Tradicion andina, diseno contemporaneo</h1>
        <p class="lead">
          Hancco Artesanias nace en las alturas de Cusco, Peru, donde un grupo de familias
          artesanas decidieron preservar las tecnicas textiles heredadas de sus abuelos.
        </p>
      </section>

      <section class="grid-2col">
        <div>
          <h2>Nuestra mision</h2>
          <p>
            Digitalizar las ventas de prendas de fibra de alpaca, conectando directamente a
            las familias artesanas con clientes que valoran la calidad, la tradicion y el
            comercio justo.
          </p>
        </div>
        <div>
          <h2>Nuestro compromiso</h2>
          <p>
            Cada prenda es tejida a mano con fibra natural. Sin intermediarios, sin
            produccion masiva. Compras directactamente a quien hizo la prenda.
          </p>
        </div>
      </section>

      <section class="values">
        <h2 class="text-center">Lo que nos define</h2>
        <div class="values-grid">
          <div class="value">
            <div class="value-icon">🧶</div>
            <h3>Hecho a mano</h3>
            <p>Tecnicas textiles tradicionales transmitidas por generaciones.</p>
          </div>
          <div class="value">
            <div class="value-icon">🦙</div>
            <h3>Fibra natural</h3>
            <p>100% alpaca de las alturas andinas, sin mezclas sinteticas.</p>
          </div>
          <div class="value">
            <div class="value-icon">⚖️</div>
            <h3>Comercio justo</h3>
            <p>Pago directo a las familias artesanas que crean cada prenda.</p>
          </div>
          <div class="value">
            <div class="value-icon">🌱</div>
            <h3>Sostenible</h3>
            <p>Produccion responsable, fibras renovables, baja huella de carbono.</p>
          </div>
        </div>
      </section>

      <section class="cta-section">
        <h2>Conoce nuestras prendas</h2>
        <p>Cada pieza cuenta una historia unica.</p>
        <a routerLink="/catalogo" class="btn btn-primary">Ver catalogo</a>
      </section>
    </div>
  `,
  styleUrls: ['./nosotros.component.scss'],
})
export class NosotrosComponent {}