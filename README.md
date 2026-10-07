# Hancco Artesanias - Sistema E-commerce

Digitalizacion de ventas de prendas de fibra de alpaca con generacion automatica de contenido visual mediante IA.

## Estructura del monorepo

```
titulacion/
├── backend/      Laravel 11 API RESTful
└── frontend/     Angular 17 SPA
```

## Stack

| Capa | Tecnologia |
|---|---|
| Backend | Laravel 11 + PHP 8.2 |
| Frontend | Angular 17 + TypeScript estricto |
| DB | MySQL 8 |
| Storage | Cloudflare R2 (S3-compatible) |
| IA | Google Gemini API (pendiente) |
| Auth | Laravel Sanctum |

## Inicio rapido

### Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

API: `http://127.0.0.1:8000`

### Frontend
```bash
cd frontend
npm install
npm start
```

Web: `http://localhost:4200` (proxy redirige `/api` al backend)

## Documentacion

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)

## Despliegue

Ambos proyectos estan preparados para desplegar sin refactor:
- Backend en Railway / Render (cambiar env vars)
- Frontend en Vercel / Netlify (cambiar apiUrl)
- MySQL gestionado o en mismo servicio Railway
- Cloudflare R2 mismas keys local y prod

## Licencia

MIT