import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-nosotros',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- HERO -->
    <section class="hero">
      <div class="hero-glow" aria-hidden="true"></div>
      <div class="container hero-inner">
        <div class="hero-text">
          <span class="badge fade-1"><span class="badge-dot"></span> Nuestra historia</span>
          <h1 class="fade-2">Tradición arequipeña, <em>diseño contemporáneo</em></h1>
          <p class="lead fade-3">
            Hancco Artesanías nace en Arequipa, la Ciudad Blanca, a pasos de la Plaza de Armas,
            con la misión de llevar la ropa tradicional peruana a todo el país.
          </p>
          <div class="hero-actions fade-4">
            <a routerLink="/catalogo" class="btn btn-primary btn-lg">Ver catálogo</a>
            <span class="loc-tag"><span aria-hidden="true">&#128205;</span> Arequipa, Perú</span>
          </div>
        </div>

        <div class="hero-visual fade-3" aria-hidden="true">
          <div class="hv-card hv-terra"></div>
          <div class="hv-card hv-gold"></div>
          <div class="hv-card hv-main">
            <span class="hv-label">Desde Arequipa</span>
            <span class="hv-title">La Ciudad<br>Blanca</span>
            <span class="hv-line"></span>
            <span class="hv-sub">Hancco Artesanías</span>
          </div>
          <div class="hv-chip hv-chip-1"><span>&#10024;</span> Telas de calidad</div>
          <div class="hv-chip hv-chip-2"><span>&#129309;</span> Sin intermediarios</div>
        </div>
      </div>
    </section>

    <!-- CINTA -->
    <div class="ribbon" aria-hidden="true">
      <div class="ribbon-track">
        @for (n of [1, 2]; track n) {
          <span class="ribbon-set">
            <span>Variedad</span><i>&#10022;</i>
            <span>Calidad</span><i>&#10022;</i>
            <span>Comercio justo</span><i>&#10022;</i>
            <span>Cercanía</span><i>&#10022;</i>
            <span>Variedad</span><i>&#10022;</i>
            <span>Calidad</span><i>&#10022;</i>
            <span>Comercio justo</span><i>&#10022;</i>
            <span>Cercanía</span><i>&#10022;</i>
          </span>
        }
      </div>
    </div>

    <!-- MISIÓN + COMPROMISO -->
    <section class="container section">
      <div class="section-head reveal">
        <span class="eyebrow">Lo que nos mueve</span>
        <h2>Una idea sencilla, <em>hecha con dedicación</em></h2>
      </div>

      <div class="duo">
        <article class="duo-card duo-light reveal">
          <span class="duo-num">01</span>
          <h3>Nuestra misión</h3>
          <p>
            Digitalizar las ventas de ropa tradicional de todo tipo, conectando directamente a
            los clientes con prendas de calidad que reflejan la identidad arequipeña.
          </p>
          <span class="duo-corner" aria-hidden="true"></span>
        </article>

        <article class="duo-card duo-dark reveal">
          <span class="duo-num">02</span>
          <h3>Nuestro compromiso</h3>
          <p>
            Cada prenda es confeccionada con telas seleccionadas y acabados cuidados. Sin
            intermediarios, compra directa y comercio transparente.
          </p>
          <span class="duo-corner" aria-hidden="true"></span>
        </article>
      </div>
    </section>

    <!-- CITA -->
    <section class="quote-band reveal">
      <div class="container">
        <span class="quote-mark" aria-hidden="true">&ldquo;</span>
        <p class="quote">Cada pieza cuenta una historia única.</p>
        <span class="quote-by">Hancco Artesanías</span>
      </div>
    </section>

    <!-- VALORES -->
    <section class="container section">
      <div class="section-head reveal">
        <span class="eyebrow">Valores</span>
        <h2>Lo que nos define</h2>
      </div>

      <div class="values-grid">
        <article class="value v-green reveal">
          <span class="value-index">01</span>
          <div class="value-icon">&#128085;</div>
          <h3>Variedad</h3>
          <p>Ropa tradicional de todo tipo, para cada ocasión y cada persona.</p>
        </article>
        <article class="value v-terra reveal">
          <span class="value-index">02</span>
          <div class="value-icon">&#10024;</div>
          <h3>Calidad</h3>
          <p>Telas y acabados de primera selección en cada prenda.</p>
        </article>
        <article class="value v-gold reveal">
          <span class="value-index">03</span>
          <div class="value-icon">&#9878;&#65039;</div>
          <h3>Comercio justo</h3>
          <p>Precios transparentes y trato directo, sin intermediarios.</p>
        </article>
        <article class="value v-wine reveal">
          <span class="value-index">04</span>
          <div class="value-icon">&#127793;</div>
          <h3>Cercanía</h3>
          <p>Estamos en el corazón de Arequipa, junto a la Plaza de Armas.</p>
        </article>
      </div>
    </section>

    <!-- UBICACIÓN -->
    <section class="container section">
      <div class="place reveal">
        <div class="place-text">
          <span class="eyebrow eyebrow-light">Dónde estamos</span>
          <h2>En el corazón de la <em>Ciudad Blanca</em></h2>
          <p>
            A pasos de la Plaza de Armas, llevamos la tradición arequipeña a tu guardarropa.
          </p>
        </div>
        <div class="place-visual" aria-hidden="true">
          <span class="ring ring-1"></span>
          <span class="ring ring-2"></span>
          <span class="ring ring-3"></span>
          <span class="pin">&#128205;</span>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="cta-glow" aria-hidden="true"></div>
      <div class="container cta-inner">
        <div>
          <h2>Conoce nuestras prendas</h2>
          <p>Cada pieza cuenta una historia única.</p>
        </div>
        <a routerLink="/catalogo" class="btn btn-accent btn-lg">Ver catálogo</a>
      </div>
    </section>
  `,
  styleUrls: ['./nosotros.component.scss'],
})
export class NosotrosComponent {}