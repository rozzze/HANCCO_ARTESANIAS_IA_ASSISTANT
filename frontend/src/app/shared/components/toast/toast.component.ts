import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { ToastService } from '../../../core/services/toast.service';

const iconos: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
};

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="false">
      @for (t of toasts(); track t.id) {
        <div class="toast" [class]="'toast-' + t.tipo" [@toastAnim]>
          <span class="toast-icon">{{ iconos[t.tipo] }}</span>
          <span class="toast-text">{{ t.texto }}</span>
          <button
            type="button"
            class="toast-close"
            (click)="cerrar(t.id)"
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styleUrls: ['./toast.component.scss'],
  animations: [
    trigger('toastAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px) scale(0.96)' }),
        animate('220ms ease-out', style({ opacity: 1, transform: 'none' })),
      ]),
      transition(':leave', [
        animate('180ms ease-in', style({ opacity: 0, transform: 'translateX(24px)' })),
      ]),
    ]),
  ],
})
export class ToastComponent {
  private toastSvc = inject(ToastService);

  toasts = this.toastSvc.toasts;
  iconos = iconos;

  cerrar(id: number): void {
    this.toastSvc.cerrar(id);
  }
}
