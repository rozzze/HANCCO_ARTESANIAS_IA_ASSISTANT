import { Directive, ElementRef, Input, OnDestroy, OnInit, inject } from '@angular/core';

/**
 * Hace aparecer un elemento suavemente cuando entra en pantalla al hacer scroll.
 * Uso: <div appReveal> o <div appReveal [revealDelay]="120">
 *
 * - Sin JavaScript o con "reducir movimiento" activado, el elemento se ve normal.
 * - Solo anima una vez (luego deja de observar).
 */
@Directive({
  selector: '[appReveal]',
  standalone: true,
})
export class RevealDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  /** Retraso en milisegundos (para escalonar varios elementos). */
  @Input() revealDelay = 0;

  ngOnInit(): void {
    const node: HTMLElement = this.el.nativeElement;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduce || typeof IntersectionObserver === 'undefined') {
      return;
    }

    node.classList.add('hv-reveal');
    if (this.revealDelay) node.style.setProperty('--reveal-delay', `${this.revealDelay}ms`);

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.classList.add('hv-visible');
            this.observer?.disconnect();
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
