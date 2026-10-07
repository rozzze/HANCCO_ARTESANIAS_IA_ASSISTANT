# Hancco Artesanias - Frontend

SPA en Angular 17 para e-commerce B2C de prendas de fibra de alpaca.

## Stack

- Angular 17 (standalone components)
- TypeScript estricto
- SCSS (sin frameworks UI externos)
- Signals + RxJS
- Angular Router con lazy loading
- HttpClient + interceptors

## Setup local

### Requisitos
- Node.js 18+ y npm 9+

### Instalacion
```bash
cd frontend
npm install
```

### Desarrollo
Asegurate de que el backend Laravel este corriendo en `http://127.0.0.1:8000`.

```bash
npm start
# ng serve --host=0.0.0.0 --port=4200
```

Frontend en `http://localhost:4200`. La configuracion `proxy.conf.json` redirige `/api/*` al backend en `http://127.0.0.1:8000`, evitando CORS en dev.

### Build produccion
```bash
npm run build
```

Salida en `dist/hancco-frontend/`. Listo para Vercel/Netlify/Cloudflare Pages.

## Estructura

```
src/
├── app/
│   ├── core/                       logica transversal
│   │   ├── guards/                 authGuard, adminGuard
│   │   ├── interceptors/           auth, error
│   │   ├── models/                 tipado de API
│   │   └── services/               HTTP a Laravel
│   ├── shared/components/          header, footer, product-card
│   ├── features/
│   │   ├── landing/                pagina de inicio
│   │   ├── catalogo/               lista + detalle
│   │   ├── categorias/             vista por categoria
│   │   ├── nosotros/               info empresa
│   │   ├── auth/                   login + register
│   │   ├── carrito/                gestion compra
│   │   └── admin/                  panel admin
│   │       ├── dashboard/
│   │       ├── productos/
│   │       │   ├── list/           tabla CRUD
│   │       │   ├── form/           crear/editar
│   │       │   └── imagen-ia/      modulo IA
│   │       ├── categorias/
│   │       ├── pedidos/
│   │       └── usuarios/
│   ├── app.config.ts
│   ├── app.routes.ts               rutas con lazy loading
│   └── app.component.ts
├── environments/
│   ├── environment.ts              localhost
│   └── environment.prod.ts         para deploy
├── styles.scss                     estilos globales
├── main.ts
└── index.html
```

## Rutas

### Publicas (sin auth)
| Ruta | Pagina |
|---|---|
| `/` | Landing |
| `/catalogo` | Lista de productos con filtros |
| `/producto/:id` | Detalle de producto |
| `/categoria/:slug` | Productos por categoria |
| `/nosotros` | Sobre la empresa |
| `/auth/login` | Iniciar sesion |
| `/auth/register` | Crear cuenta |

### Cliente (requiere login)
| Ruta | Pagina |
|---|---|
| `/carrito` | Mi carrito + checkout |

### Admin (requiere rol admin)
| Ruta | Pagina |
|---|---|
| `/admin` | Dashboard |
| `/admin/productos` | CRUD productos |
| `/admin/productos/nuevo` | Crear producto |
| `/admin/productos/:id/editar` | Editar producto |
| `/admin/productos/:id/imagenes` | **Modulo imagen IA** |
| `/admin/categorias` | CRUD categorias |
| `/admin/pedidos` | Gestion pedidos |
| `/admin/usuarios` | Gestion usuarios |

## Modulo IA (pendiente backend)

La UI del modulo de mejora de imagen con IA esta implementada en `/admin/productos/:id/imagenes`. El endpoint backend responde 501 hasta que se implemente `GeminiService`. El frontend maneja el error mostrando un mensaje claro al usuario.

Flujo implementado:
1. Admin abre `/admin/productos/:id/imagenes`
2. Ve todas las imagenes del producto
3. Sube nuevas imagenes reales (van a R2 → `productos/{slug}/foto_real/`)
4. Click en "✨ Mejorar con IA" en cualquier imagen
5. Modal con selector de maniqui + fondo
6. Click "Generar" → llama backend (actualmente 501)
7. Cuando backend este listo, imagen se reemplaza en `imagenes_ia/`

## Estilos

- Sistema de diseno artesanal/andino: paleta tierra (marron, beige, naranja), tipografia Playfair Display (titulos) + Inter (cuerpo)
- Mobile-first responsive
- Componentes en CSS vanilla sin dependencias externas
- Variables CSS en `:root` para temas

## Cuentas demo (necesitas backend corriendo)

- Admin: `admin@hancco.com` / `admin1234`
- Cliente: `cliente@hancco.com` / `cliente1234`

## Despliegue

### Opcion A: Vercel
1. Conectar repo GitHub
2. Build command: `npm run build`
3. Output dir: `dist/hancco-frontend/browser`
4. Env var `API_URL` apuntando al backend deployado
5. Actualizar `environment.prod.ts` antes de build (o usar build flag)

### Opcion B: Netlify
1. Conectar repo
2. Build: `npm run build`
3. Publish dir: `dist/hancco-frontend/browser`
4. `_redirects` file con `/* /index.html 200` para SPA routing

### Opcion C: Build estatico
```bash
npm run build
# subir contenido de dist/hancco-frontend/browser/ a cualquier hosting estatico
```

## Variables de entorno

| Variable | Descripcion |
|---|---|
| `apiUrl` | URL base del backend Laravel |

Solo aplica en build time (Angular no tiene runtime env vars por defecto). Modifica `environment.prod.ts` antes del build de produccion.