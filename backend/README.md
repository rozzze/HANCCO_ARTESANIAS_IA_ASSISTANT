# Hancco Artesanias - Backend API

Laravel 11 API RESTful para e-commerce B2C de prendas de fibra de alpaca.

## Stack

- PHP 8.2+
- Laravel 11
- MySQL 8
- Laravel Sanctum (auth tokens)
- Cloudflare R2 (almacenamiento imagenes, S3-compatible)
- Google Gemini API (modulo IA, pendiente de implementar)

## Setup local

### 1. Requisitos
- PHP 8.2 o superior con extensiones: pdo_mysql, mbstring, openssl, tokenizer, xml, ctype, json, bcmath, fileinfo, curl
- Composer 2.x
- MySQL 8 (XAMPP, Laragon, Docker o nativo)

### 2. Instalacion
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

### 3. Configurar `.env`
Edita `.env` con tus valores:

```env
DB_DATABASE=hancco_artesanias
DB_USERNAME=root
DB_PASSWORD=

CLOUDFLARE_R2_ACCOUNT_ID=tu_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=tu_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=tu_secret_key
CLOUDFLARE_R2_BUCKET=hancco-imagenes
CLOUDFLARE_R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
CLOUDFLARE_R2_PUBLIC_URL=https://pub-<bucket>.r2.dev

GEMINI_API_KEY=  # dejar vacio por ahora
```

### 4. Crear base de datos
```sql
CREATE DATABASE hancco_artesanias CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Migrar y sembrar
```bash
php artisan migrate --seed
```

Esto crea:
- 1 admin: `admin@hancco.com` / `admin1234`
- 1 cliente demo: `cliente@hancco.com` / `cliente1234`
- 6 categorias: chompas, ponchos, chalinas, guantes, gorros, mantas
- 4 maniquies

### 6. Levantar servidor
```bash
php artisan serve
```

API disponible en `http://127.0.0.1:8000`

## Endpoints principales

### Publicos (sin auth)
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/api/auth/register` | Registro |
| POST | `/api/auth/login` | Login |
| GET | `/api/categorias` | Listar categorias |
| GET | `/api/productos` | Listar productos (con filtros) |
| GET | `/api/productos/{id}` | Detalle producto |
| GET | `/api/maniquies` | Listar maniquies disponibles |

### Cliente autenticado (Sanctum)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/auth/me` | Usuario actual |
| POST | `/api/auth/logout` | Cerrar sesion |
| GET | `/api/carrito` | Ver mi carrito |
| POST | `/api/carrito/items` | Agregar item |
| PATCH | `/api/carrito/items/{id}` | Actualizar cantidad |
| DELETE | `/api/carrito/items/{id}` | Eliminar item |
| DELETE | `/api/carrito` | Vaciar carrito |
| POST | `/api/pedidos/checkout` | Convertir carrito en pedido |
| GET | `/api/pedidos` | Mis pedidos |
| GET | `/api/pedidos/{id}` | Detalle pedido |
| POST | `/api/pedidos/{id}/pago` | Registrar pago |

### Admin (Sanctum + middleware admin)
| Metodo | Ruta | Descripcion |
|---|---|---|
| CRUD | `/api/admin/categorias` | CRUD categorias |
| CRUD | `/api/admin/maniquies` | CRUD maniquies |
| CRUD | `/api/admin/productos` | CRUD productos |
| PATCH | `/api/admin/productos/{id}/stock` | Actualizar stock |
| GET/POST | `/api/admin/productos/{id}/imagenes` | Listar/subir imagenes |
| GET/PATCH/DELETE | `/api/admin/imagenes/{id}` | Gestionar imagen individual |
| POST | `/api/admin/imagenes/{id}/mejorar-ia` | **Mejorar imagen con IA (stub 501)** |
| GET/SHOW/UPDATE | `/api/admin/pedidos` | Gestionar pedidos |
| INDEX/SHOW/UPDATE/DELETE | `/api/admin/usuarios` | Gestionar usuarios |

## Modulo IA - Pendiente

El endpoint `POST /api/admin/imagenes/{id}/mejorar-ia` y los servicios `GeminiService` + `ImageEnhancementService` estan implementados como stubs que retornan `501 Not Implemented`.

Cuando tengas la API key de Gemini:
1. Agregar `GEMINI_API_KEY` en `.env`
2. Implementar `GeminiService::generarImagenManiqui()` con llamada HTTP al endpoint de Gemini
3. Implementar `ImageEnhancementService::mejorarImagen()` para orquestar descarga R2 → llamada Gemini → subida R2

## Estructura de almacenamiento en Cloudflare R2

```
bucket-r2/
└── productos/
    └── {slug-producto}/         ← se regenera si renombras el producto
        ├── foto_real/           ← imagenes crudas subidas por el admin
        │   ├── {uuid}.jpg
        │   ├── {uuid}.png
        │   └── ...
        └── imagenes_ia/         ← outputs generados por IA (futuro modulo Gemini)
            └── {uuid}.png
```

- Las URLs se guardan en `imagenes.url_cloudflare_s3`.
- Al renombrar un producto, su slug cambia y la carpeta se migra automaticamente:
  - Archivos se mueven en R2 (`copy` + `delete`).
  - URLs en BD se reescriben al nuevo path.
  - Si R2 falla, URLs en BD se actualizan igualmente (la operacion de move no bloquea el rename).

## Estructura del proyecto

```
app/
├── Http/
│   ├── Controllers/Api/         (publicos)
│   ├── Controllers/Api/Admin/   (admin)
│   ├── Middleware/EnsureAdmin.php
│   └── Resources/                (JsonResources)
├── Models/                       (9 modelos)
├── Providers/
│   ├── AppServiceProvider.php
│   └── CloudflareR2ServiceProvider.php
└── Services/
    ├── CloudflareR2Service.php   (funcional)
    ├── GeminiService.php          (stub)
    └── ImageEnhancementService.php (stub)

database/
├── migrations/                   (11 migraciones)
└── seeders/
    ├── AdminUserSeeder.php
    ├── CategoriaSeeder.php
    ├── ManiquiSeeder.php
    └── DatabaseSeeder.php

routes/
├── api.php
└── console.php

config/
├── auth.php
├── cors.php
├── database.php
├── filesystems.php
├── logging.php
├── sanctum.php
└── services.php
```

## Comandos utiles

```bash
php artisan migrate:fresh --seed   # Resetear DB y sembrar
php artisan route:list             # Ver todas las rutas
php artisan tinker                  # Consola interactiva
php artisan make:controller ...    # Generar controller
php artisan make:model ...         # Generar model
```

## Despliegue

Cuando decidas desplegar:

1. **Backend:** Railway, Render o similar
   - Setear variables de entorno en el dashboard
   - Build: `composer install --no-dev --optimize-autoloader`
   - Start: `php artisan serve --host=0.0.0.0 --port=$PORT`
   - Postdeploy: `php artisan migrate --force`

2. **MySQL:** Provisionar DB en el mismo servicio o externo (Clever Cloud, DigitalOcean)
   - Cambiar `DB_*` en env vars del hosting

4. **Cloudflare R2:** Las mismas keys funcionan local y produccion
5. **Frontend Angular:** `environment.prod.ts` apuntando a URL del backend deployado

## Licencia

MIT