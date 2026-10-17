import { Component, ChangeDetectionStrategy, OnInit, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ImagenService } from '../../../../core/services/imagen.service';
import { ManiquiService, Maniqui } from '../../../../core/services/maniqui.service';
import { ProductoService } from '../../../../core/services/producto.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Imagen, Producto } from '../../../../core/models/producto.model';

@Component({
  selector: 'app-imagen-ia',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <a [routerLink]="['/admin/productos', id, 'editar']" class="back-link">← Editar producto</a>

      @if (producto(); as p) {
        <p class="page-context">Imagenes de <strong>{{ p.nombre }}</strong></p>
        <p class="text-muted">
          Sube fotos reales del producto y opcionalmente mejoralas con IA para catalogos profesionales.
        </p>

        <div class="upload-zone">
          <input type="file" accept="image/*" #fileInput hidden (change)="onFile($event)">
          <button class="btn btn-primary" (click)="fileInput.click()" [disabled]="subiendo()">
            @if (subiendo()) {
              <span class="spinner"></span> Subiendo...
            } @else {
              📷 Subir imagen
            }
          </button>
          <p class="hint">JPG, PNG, WEBP. Max 10MB.</p>
        </div>

        @if (error()) {
          <div class="alert alert-error mt-2">{{ error() }}</div>
        }
        @if (mensaje()) {
          <div class="alert alert-success mt-2">{{ mensaje() }}</div>
        }

        @if (imagenes().length > 0) {
          <div class="image-grid mt-3">
            @for (img of imagenes(); track img.id) {
              <div class="img-card" [class.principal]="img.es_principal">
                <div class="img-wrap" (click)="abrirVisor(img)" role="button" tabindex="0" (keydown)="onVisorKey($event, img)" title="Click para ver imagen completa y URL">
                  <img [src]="img.url_cloudflare_s3" [alt]="p.nombre">
                  <span class="img-zoom-hint">🔍 Ver imagen</span>
                  @if (img.generada_ia) {
                    <span class="badge-ia">✨ IA</span>
                  }
                  @if (img.es_principal) {
                    <span class="badge-principal">Principal</span>
                  }
                </div>

                <div class="img-actions">
                  <button class="btn btn-secondary btn-sm" (click)="abrirIa(img)" [disabled]="procesandoIa()">
                    ✨ Generar con IA
                  </button>
                  @if (!img.es_principal) {
                    <button class="btn btn-secondary btn-sm" (click)="marcarPrincipal(img)">Marcar principal</button>
                  }
                  <button class="btn btn-danger btn-sm" (click)="eliminar(img)">Eliminar</button>
                </div>
              </div>
            }
          </div>
        } @else {
          <p class="text-center text-muted empty">Aun no hay imagenes para este producto.</p>
        }

        @if (imgVista(); as imgV) {
          <div class="modal-backdrop" (click)="cerrarVisor()">
            <div class="modal modal-visor" (click)="$event.stopPropagation()">
              <header class="visor-head">
                <h2>Imagen #{{ imgV.id }}</h2>
                <button class="btn-icon visor-close" (click)="cerrarVisor()" title="Cerrar">✕</button>
              </header>

              <div class="visor-body">
                <div class="visor-img-wrap">
                  <img
                    [src]="imgV.url_cloudflare_s3"
                    [alt]="producto()?.nombre ?? 'imagen'"
                    (load)="onVistaLoad()"
                    (error)="onVistaError()"
                  >
                  @if (cargada() === null) {
                    <div class="visor-loading"><span class="spinner spinner-lg"></span></div>
                  } @else if (cargada() === false) {
                    <div class="visor-error">
                      <span>⚠️</span>
                      <p>No se pudo cargar la imagen.</p>
                      <p class="text-muted">Verifica permisos del bucket R2 o que el recurso exista.</p>
                    </div>
                  }
                </div>

                <aside class="visor-info">
                  <div class="info-field">
                    <label class="info-label">URL publica Cloudflare R2 / S3</label>
                    <div class="url-row">
                      <input readonly [value]="imgV.url_cloudflare_s3" class="form-control url-input">
                      <button class="btn btn-secondary btn-sm" (click)="copiarUrl(imgV.url_cloudflare_s3)" title="Copiar URL">
                        {{ copiado() ? '✓' : '⧉' }}
                      </button>
                    </div>
                    <a [href]="imgV.url_cloudflare_s3" target="_blank" rel="noopener noreferrer" class="open-link">
                      Abrir en nueva pestaña ↗
                    </a>
                  </div>

                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">ID</span>
                      <span class="info-value">{{ imgV.id }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Producto</span>
                      <span class="info-value">{{ imgV.producto_id }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Generada IA</span>
                      <span class="info-value">
                        <span class="badge" [class.badge-on]="imgV.generada_ia">
                          {{ imgV.generada_ia ? 'Si' : 'No' }}
                        </span>
                      </span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Es principal</span>
                      <span class="info-value">
                        <span class="badge" [class.badge-on]="imgV.es_principal">
                          {{ imgV.es_principal ? 'Si' : 'No' }}
                        </span>
                      </span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Orden</span>
                      <span class="info-value">{{ imgV.orden }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Subida</span>
                      <span class="info-value">{{ imgV.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                  </div>

                  <div class="status-box" [class.status-ok]="cargada() === true" [class.status-fail]="cargada() === false" [class.status-loading]="cargada() === null">
                    @if (cargada() === null) {
                      <span class="spinner"></span> Verificando disponibilidad del recurso...
                    } @else if (cargada()) {
                      ✓ Recurso disponible y accesible
                    } @else {
                      ✕ Recurso no disponible
                    }
                  </div>

                  <div class="visor-actions">
                    <button class="btn btn-secondary btn-sm" (click)="abrirIa(imgV)">✨ Generar con IA</button>
                    @if (!imgV.es_principal) {
                      <button class="btn btn-secondary btn-sm" (click)="marcarPrincipal(imgV); cerrarVisor()">Marcar principal</button>
                    }
                    <button class="btn btn-danger btn-sm" (click)="eliminar(imgV); cerrarVisor()">Eliminar</button>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        }

        @if (modalIa()) {
          <div class="modal-backdrop" (click)="cerrarIa()">
            <div class="modal modal-ia" (click)="$event.stopPropagation()">
              <h2>✨ Generar con IA</h2>
              <p class="text-muted">
                Combina la prenda con un maniqui vacio. Gemini viste el maniqui con tu prenda.
              </p>

              <div class="ia-source">
                <h4>Prenda origen</h4>
                <img [src]="modalIa()!.url_cloudflare_s3" alt="prenda origen">
              </div>

              <div class="ia-maniquies">
                <h4>Elige un maniqui</h4>
                @if (maniquies().length === 0) {
                  <p class="text-muted">
                    No hay maniquies para esta categoria. Crea uno en Maniquies.
                  </p>
                } @else {
                  <div class="maniqui-grid">
                    @for (m of maniquies(); track m.id) {
                      <button
                        type="button"
                        class="maniqui-opt"
                        [class.sel]="maniquiSel() === m.id"
                        [disabled]="!m.url_referencia || sinImagen().includes(m.id)"
                        (click)="maniquiSel.set(m.id)"
                        [title]="m.nombre"
                      >
                        <span class="opt-img">
                          @if (m.url_referencia && !sinImagen().includes(m.id)) {
                            <img [src]="m.url_referencia" [alt]="m.nombre" loading="lazy" (error)="marcarSinImagen(m.id)">
                          } @else {
                            <span class="opt-noimg">Sin imagen</span>
                          }
                        </span>
                        <span>{{ m.nombre }}</span>
                      </button>
                    }
                  </div>
                }
              </div>

              @if (resultado()) {
                <div class="ia-result">
                  <h4>Resultado</h4>
                  <img [src]="resultado()!.url_cloudflare_s3" alt="resultado IA">
                </div>
              }

              @if (errorIa()) {
                <div class="alert alert-error">{{ errorIa() }}</div>
              }

              <div class="modal-actions">
                <button class="btn btn-secondary" (click)="cerrarIa()">Cerrar</button>
                @if (resultado()) {
                  <button class="btn btn-secondary" (click)="generar()" [disabled]="procesandoIa() || !maniquiSel()">
                    🔁 Regenerar
                  </button>
                }
                <button class="btn btn-primary" (click)="generar()" [disabled]="procesandoIa() || !maniquiSel()">
                  @if (procesandoIa()) {
                    <span class="spinner"></span> Generando...
                  } @else {
                    ✨ Generar
                  }
                </button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styleUrls: ['./imagen-ia.component.scss'],
})
export class ImagenIaComponent implements OnInit {
  private imagenSvc = inject(ImagenService);
  private productoSvc = inject(ProductoService);
  private maniquiSvc = inject(ManiquiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  @Input() id?: string;

  producto = signal<Producto | null>(null);
  imagenes = signal<Imagen[]>([]);
  maniquies = signal<Maniqui[]>([]);

  subiendo = signal(false);
  procesandoIa = signal(false);
  error = signal('');
  mensaje = signal('');
  errorIa = signal('');

  modalIa = signal<Imagen | null>(null);
  maniquiSel = signal<number | null>(null);
  resultado = signal<Imagen | null>(null);
  sinImagen = signal<number[]>([]);

  imgVista = signal<Imagen | null>(null);
  cargada = signal<boolean | null>(null);
  copiado = signal(false);
  private copiadoTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    const productoId = Number(this.id ?? this.route.snapshot.paramMap.get('id'));
    this.productoSvc.obtenerAdmin(productoId).subscribe({
      next: (res) => {
        this.producto.set(res.data);
        this.cargarManiquies(res.data.categoria_id);
      },
    });
    this.cargarImagenes(productoId);
  }

  cargarManiquies(categoriaId: number): void {
    this.maniquiSvc.listarPublico(categoriaId).subscribe({
      next: (res) => this.maniquies.set(res.data ?? []),
      error: () => this.maniquies.set([]),
    });
  }

  marcarSinImagen(id: number): void {
    this.sinImagen.update((list) => (list.includes(id) ? list : [...list, id]));
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const productoId = Number(this.id ?? this.route.snapshot.paramMap.get('id'));
    this.subiendo.set(true);
    this.imagenSvc.subir(productoId, file).subscribe({
      next: () => {
        this.subiendo.set(false);
        this.mensaje.set('Imagen subida.');
        this.cargarImagenes(productoId);
        input.value = '';
      },
      error: (err) => {
        this.subiendo.set(false);
        this.error.set(err.error?.message ?? 'Error al subir.');
      },
    });
  }

  cargarImagenes(productoId: number): void {
    this.imagenSvc.listar(productoId).subscribe({
      next: (res) => this.imagenes.set(res.data),
    });
  }

  marcarPrincipal(img: Imagen): void {
    this.imagenSvc.actualizar(img.id, { es_principal: true }).subscribe({
      next: () => {
        const productoId = Number(this.id ?? this.route.snapshot.paramMap.get('id'));
        this.cargarImagenes(productoId);
      },
    });
  }

  eliminar(img: Imagen): void {
    if (!confirm('Eliminar imagen?')) return;
    this.imagenSvc.eliminar(img.id).subscribe({
      next: () => this.imagenes.update((list) => list.filter((i) => i.id !== img.id)),
    });
  }

  abrirIa(img: Imagen): void {
    this.errorIa.set('');
    this.resultado.set(null);
    this.maniquiSel.set(null);
    this.modalIa.set(img);
  }

  cerrarIa(): void {
    this.modalIa.set(null);
    this.resultado.set(null);
  }

  generar(): void {
    const img = this.modalIa();
    const maniquiId = this.maniquiSel();
    if (!img || maniquiId === null) return;

    this.procesandoIa.set(true);
    this.errorIa.set('');
    this.imagenSvc.mejorarConIa(img.id, maniquiId).subscribe({
      next: (res) => {
        this.procesandoIa.set(false);
        this.resultado.set(res.data);
        this.mensaje.set('Imagen generada con IA.');
        const productoId = Number(this.id ?? this.route.snapshot.paramMap.get('id'));
        this.cargarImagenes(productoId);
      },
      error: (err) => {
        this.procesandoIa.set(false);
        this.errorIa.set(err.error?.detalle ?? err.error?.message ?? 'Error al generar con IA.');
      },
    });
  }

  abrirVisor(img: Imagen): void {
    this.imgVista.set(img);
    this.cargada.set(null);
    this.copiado.set(false);
  }

  cerrarVisor(): void {
    this.imgVista.set(null);
    this.cargada.set(null);
    this.copiado.set(false);
  }

  onVisorKey(event: KeyboardEvent, img: Imagen): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.abrirVisor(img);
    }
  }

  onVistaLoad(): void {
    this.cargada.set(true);
  }

  onVistaError(): void {
    this.cargada.set(false);
  }

  copiarUrl(url: string): void {
    if (!url) return;
    const done = () => {
      this.copiado.set(true);
      this.toast.success('URL copiada al portapapeles.');
      if (this.copiadoTimer) clearTimeout(this.copiadoTimer);
      this.copiadoTimer = setTimeout(() => this.copiado.set(false), 2000);
    };
    const fail = () => this.toast.error('No se pudo copiar. Copialo manualmente.');
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(() => this.fallbackCopy(url, done, fail));
    } else {
      this.fallbackCopy(url, done, fail);
    }
  }

  private fallbackCopy(text: string, done: () => void, fail: () => void): void {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    } catch {
      fail();
    }
  }
}