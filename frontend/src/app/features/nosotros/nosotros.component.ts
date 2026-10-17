import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-nosotros',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container page">
      <section class="hero-section">
        <span class="eyebrow">Nuestra Historia</span>
        <h1>Tradicion arequipena, diseno contemporaneo</h1>
        <p class="lead">
          Hancco Artesanias nace en Arequipa, la Ciudad Blanca, a pasos de la Plaza de Armas,
          con la mision de llevar la ropa tradicional peruana a todo el pais.
        </p>
      </section>

      <section class="grid-2col">
        <div>
          <h2>Nuestra mision</h2>
          <p>
            Digitalizar las ventas de ropa tradicional de todo tipo, conectando directamente a
            los clientes con prendas de calidad que reflejan la identidad arequipena.
          </p>
        </div>
        <div>
          <h2>Nuestro compromiso</h2>
          <p>
            Cada prenda es confeccionada con telas seleccionadas y acabados cuidados. Sin
            intermediarios, compra directa y comercio transparente.
          </p>
        </div>
      </section>

      <section class="values">
        <h2 class="text-center">Lo que nos define</h2>
        <div class="values-grid">
          <div class="value">
            <div class="value-icon">&#128085;</div>
            <h3>Variedad</h3>
            <p>Ropa tradicional de todo tipo, para cada ocasion y cada persona.</p>
          </div>
          <div class="value">
            <div class="value-icon">&#10024;</div>
            <h3>Calidad</h3>
            <p>Telas y acabados de primera seleccion en cada prenda.</p>
          </div>
          <div class="value">
            <div class="value-icon">&#9878;&#65039;</div>
            <h3>Comercio justo</h3>
            <p>Precios transparentes y trato directo, sin intermediarios.</p>
          </div>
          <div class="value">
            <div class="value-icon">&#127793;</div>
            <h3>Cercania</h3>
            <p>Estamos en el corazon de Arequipa, junto a la Plaza de Armas.</p>
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