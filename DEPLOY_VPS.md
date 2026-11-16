# Guía paso a paso: subir el backend a un VPS (desde cero)

Esta guía te lleva desde **crear las cuentas** hasta tener **la tienda funcionando** con:

- **Frontend:** sigue en Vercel, con el link que ya tienes (`hancco-artesanias.vercel.app`).
- **Backend + base de datos:** en tu propio VPS (~$5/mes) administrado con **Coolify**.
- **Dominio del backend:** gratis con **DuckDNS** (`hancco-api.duckdns.org`).

⏱️ Tiempo aproximado: **2–3 horas** la primera vez. Hazlo con calma y en orden.

> 🧭 **Regla de oro:** no borres nada de Laravel Cloud hasta el **Paso 13**. Mientras tanto la tienda sigue funcionando como ahora.

---

## ✅ Lista de cuentas que vas a crear

| Servicio | Para qué | Costo |
|---|---|---|
| **Hetzner** (u otro VPS) | El servidor donde vive el backend | ~$5/mes |
| **DuckDNS** | Un nombre (dominio) gratis para el backend | Gratis |
| **Brevo** | Enviar correos de "Olvidé mi contraseña" | Gratis |
| **UptimeRobot** | Avisarte si la página se cae | Gratis |

Ya tienes: **GitHub**, **Vercel**, **Cloudflare R2**, **Google AI Studio (Gemini)**, **Culqi** y **Laravel Cloud**.

---

## Paso 0 — Guardar tus claves actuales (¡antes de todo!)

Algunas claves **solo están en Laravel Cloud** (las de R2 y Culqi no están en tu `.env` local). Cópialas ahora, porque después vas a borrar Laravel Cloud.

1. Entra a **cloud.laravel.com** → tu aplicación → entorno **production** → **Settings** → **Environment variables**.
2. Copia **todas** las variables a un archivo de notas **privado** en tu Mac (no lo subas a GitHub). Las que más importan:
   - `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET`, `CLOUDFLARE_R2_ENDPOINT`, `CLOUDFLARE_R2_PUBLIC_URL`
   - `GEMINI_API_KEY`
   - `CULQI_PUBLIC_KEY`, `CULQI_SECRET_KEY`, `CULQI_ENV`
   - `YAPE_NUMERO`, `YAPE_QR_URL`, `WHATSAPP_TIENDA`
   - Si hay variables `MAIL_...`, cópialas también.

---

## Paso 1 — Subir a GitHub los cambios del proyecto

Coolify descarga el código desde GitHub, así que primero hay que subir el `Dockerfile` y los demás cambios.

Abre la app **Terminal** en tu Mac y ejecuta, uno por uno:

```bash
cd ~/titulacion
```

```bash
git status
```

Si ves archivos `.tex` como **deleted** y **no** los borraste a propósito, recupéralos:

```bash
git restore documento_sprint4_imagenes_ia.tex documento_sprint5_descripciones_ia.tex documento_sprint7_carrito_compras.tex
```

Luego sube los cambios:

```bash
git add DEPLOY_VPS.md backend/Dockerfile backend/.dockerignore backend/.env.production.example backend/bootstrap/app.php backend/config/cors.php frontend/vercel.json frontend/scripts/set-env.mjs
```

```bash
git commit -m "Preparar despliegue del backend en VPS con Coolify"
```

```bash
git push
```

> Subir esto **no rompe nada**: Vercel sigue usando el backend de Laravel Cloud hasta el Paso 11.

---

## Paso 2 — Crear tu llave SSH (tu "llave" para entrar al servidor)

En la **Terminal** de tu Mac:

```bash
ls ~/.ssh/id_ed25519.pub
```

- Si dice **"No such file"**, créala (presiona **Enter** a todo lo que pregunte):
  ```bash
  ssh-keygen -t ed25519 -C "hancco-vps"
  ```
- Copia la llave **pública** al portapapeles:
  ```bash
  pbcopy < ~/.ssh/id_ed25519.pub
  ```

Ya la tienes copiada, la vas a pegar en el siguiente paso.

---

## Paso 3 — Crear la cuenta y el servidor (VPS)

### 3.1 Crear la cuenta en Hetzner

1. Entra a **hetzner.com/cloud** → **Sign up**.
2. Confirma tu correo y agrega un método de pago (tarjeta o PayPal).
3. Puede que te pidan **verificar identidad** (foto del DNI). Es normal y a veces tarda unas horas.

> Si Hetzner no te acepta, alternativas parecidas: **Contabo**, **Vultr** o **DigitalOcean**. Los pasos son casi iguales; lo importante es que el plan tenga **mínimo 2 GB de RAM**.

### 3.2 Crear el servidor

En la consola de Hetzner: **+ New project** → nombre `hancco` → entra al proyecto → **Add Server**:

| Opción | Qué elegir |
|---|---|
| **Location** | **Ashburn (USA Este)**, la más cercana a Perú |
| **Image** | **Ubuntu 24.04** |
| **Type** | El más barato con **≥ 2 GB de RAM** (Shared vCPU) |
| **Networking** | ✅ Public IPv4 |
| **SSH keys** | **Add SSH key** → pega con `Cmd + V` lo que copiaste en el Paso 2 |
| **Name** | `hancco-vps` |

Pulsa **Create & Buy now**. En un minuto verás tu servidor con su **IP**, por ejemplo `5.161.12.34`. **Anótala**; en esta guía la llamamos `TU_IP`.

---

## Paso 4 — Instalar Coolify en el servidor

1. En la Terminal de tu Mac, conéctate al servidor (cambia `TU_IP`):
   ```bash
   ssh root@TU_IP
   ```
   La primera vez pregunta *"Are you sure you want to continue connecting?"*: escribe `yes` y Enter.
2. Ya estás **dentro del servidor** (el texto de la terminal cambia a `root@hancco-vps`). Instala Coolify:
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```
   Tarda unos 5 minutos. Espera a que diga que terminó.
3. Abre en tu navegador: `http://TU_IP:8000`
4. **Registra tu usuario** administrador de Coolify. Usa una contraseña **larga y segura**: este panel controla todo tu servidor.
5. En el asistente inicial elige **"This Machine" / localhost** como servidor y sigue con las opciones por defecto.

> Para salir del servidor en la terminal escribe `exit`.

---

## Paso 5 — Crear tu dominio gratis en DuckDNS

1. Entra a **duckdns.org** → inicia sesión con **Google** o **GitHub**.
2. En **sub domain** escribe `hancco-api` → **add domain**. (Si está ocupado, elige otro y úsalo en lugar de `hancco-api` en toda la guía.)
3. En la fila de tu dominio, campo **current ip**: escribe `TU_IP` → **update ip**.
4. Comprueba en la Terminal de tu Mac (Ctrl + C para detener):
   ```bash
   ping hancco-api.duckdns.org
   ```
   Debe responder con **tu IP**. Si no, espera 2–3 minutos y vuelve a probar.

---

## Paso 6 — Crear la base de datos MySQL en Coolify

1. En Coolify: **Projects** → **+ Add** → nombre `hancco` → entra → environment **production**.
2. **+ New** → **Database** → **MySQL**.
3. Antes de iniciarla, revisa la configuración:
   - **Initial Database** (o *MySQL Database*): `hancco_artesanias`
   - **Normal User**: `hancco`
   - Las contraseñas las genera Coolify. **Déjalas así.**
4. Pulsa **Start**.
5. Anota estos datos (están en la misma página):
   - **Usuario**, **contraseña** y **nombre de la base**.
   - El **host interno**: en *"MySQL URL (internal)"* verás algo como `mysql://hancco:CLAVE@abc123xyz:3306/hancco_artesanias`. El host es la parte entre `@` y `:3306` → `abc123xyz`.

---

## Paso 7 — Crear el backend en Coolify

### 7.1 Conectar GitHub

1. En el proyecto `hancco` → **+ New** → **Application**.
2. ¿Tu repositorio es **privado**? → elige **Private Repository (with GitHub App)** y sigue el asistente: te lleva a GitHub para autorizar a Coolify **solo** el repo `HANCCO_ARTESANIAS_IA_ASSISTANT`.
   ¿Es **público**? → elige **Public Repository** y pega `https://github.com/rozzze/HANCCO_ARTESANIAS_IA_ASSISTANT`.

### 7.2 Configurar la aplicación

| Campo | Valor |
|---|---|
| **Branch** | `main` |
| **Build Pack** | **Dockerfile** |
| **Base Directory** | `/backend` |
| **Ports Exposes** | `8080` |
| **Domains** | `https://hancco-api.duckdns.org` |

En **Advanced / Health check**: activa el health check con path **`/up`**.

### 7.3 Generar la APP_KEY

En la Terminal de tu Mac (no en el servidor):

```bash
cd ~/titulacion/backend
```

```bash
php artisan key:generate --show
```

Copia lo que sale (empieza con `base64:...`).

### 7.4 Variables de entorno

En la app de Coolify → **Environment Variables** → **Developer view** (edición en bloque). Abre el archivo [`backend/.env.production.example`](backend/.env.production.example), copia todo su contenido, pégalo y **llena los valores**:

| Variable | De dónde sale |
|---|---|
| `APP_KEY` | Lo que copiaste en 7.3 |
| `APP_URL` | `https://hancco-api.duckdns.org` |
| `FRONTEND_URL` | `https://hancco-artesanias.vercel.app` (tu link de Vercel) |
| `DB_HOST` | El host interno del Paso 6 (ej. `abc123xyz`) |
| `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Los datos del Paso 6 |
| `CLOUDFLARE_R2_...` | Lo que guardaste en el Paso 0 |
| `GEMINI_API_KEY` | Paso 0 (o *aistudio.google.com* → API keys) |
| `CULQI_...` | Paso 0 (o tu panel de Culqi) |
| `YAPE_...`, `WHATSAPP_TIENDA` | Paso 0 |
| `MAIL_...` | Paso 8 (puedes dejarlo para después) |

Guarda.

### 7.5 Desplegar

Pulsa **Deploy** y mira los **logs**. La primera vez tarda unos 3–5 minutos. Cuando termine, abre en el navegador:

- `https://hancco-api.duckdns.org/up` → debe mostrar una página de "Application up".
- `https://hancco-api.duckdns.org/api/categorias` → debe mostrar `{"data":[]}`.

Si sale un aviso de "conexión no segura", espera unos minutos: Coolify todavía está sacando el certificado HTTPS.

---

## Paso 8 — Correo para "Olvidé mi contraseña" (Brevo, gratis)

1. Crea una cuenta en **brevo.com**.
2. **Senders** → agrega y **verifica** el correo que enviará los mensajes (por ejemplo, el Gmail de la tienda).
3. **SMTP & API** → pestaña **SMTP** → genera una **SMTP key**.
4. En Coolify (Environment Variables):
   ```
   MAIL_MAILER=smtp
   MAIL_HOST=smtp-relay.brevo.com
   MAIL_PORT=587
   MAIL_USERNAME=(el "Login" que muestra Brevo)
   MAIL_PASSWORD=(la SMTP key)
   MAIL_FROM_ADDRESS=(el correo que verificaste)
   ```
5. **Redeploy** en Coolify.

---

## Paso 9 — Crear el administrador y los datos base

En Coolify → tu app → **Terminal** → elige el contenedor de la app y ejecuta:

```bash
php artisan db:seed --force
```

Esto crea las categorías, los maniquíes y el usuario admin `admin@hancco.com`, que viene con una **clave de prueba**. Cámbiala ya (pon tu propia clave larga donde dice `UNA-CLAVE-LARGA-Y-SEGURA`) y borra el cliente de demo:

```bash
php artisan tinker --execute="App\Models\Usuario::where('correo','admin@hancco.com')->first()->update(['contrasena'=>Hash::make('UNA-CLAVE-LARGA-Y-SEGURA')]); App\Models\Usuario::where('correo','cliente@hancco.com')->delete();"
```

---

## Paso 10 — Backups automáticos de la base de datos (a tu R2)

Así, si algo se rompe, no se pierden los pedidos de tu mamá.

1. **Cloudflare** → **R2** → **Create bucket** → nombre `hancco-backups`.
2. R2 → **Manage API tokens** → **Create API token** → permiso **Object Read & Write** solo para `hancco-backups`. Copia el **Access Key ID**, el **Secret Access Key** y el **endpoint** (`https://<account-id>.r2.cloudflarestorage.com`).
3. Coolify → **Storages** → **+ Add** → tipo S3:
   - Endpoint: el de R2
   - Bucket: `hancco-backups`
   - Region: `auto`
   - Access/Secret Key: los del token
4. Coolify → tu MySQL → **Backups** → activa un backup programado **diario** con destino el storage S3 que creaste.

---

## Paso 11 — Conectar el frontend de Vercel al nuevo backend

1. Entra a **vercel.com** → tu proyecto del frontend → **Settings** → **Environment Variables**.
2. Agrega:
   - **Key:** `API_URL`
   - **Value:** `https://hancco-api.duckdns.org`
   - **Environments:** ✅ Production
3. **Save**.
4. Ve a **Deployments** → en el último deployment pulsa **⋯** → **Redeploy**.
5. Cuando termine, abre tu página de Vercel y prueba:
   - Que cargue el catálogo y las categorías.
   - Iniciar sesión como admin.
   - Crear un producto, subir una foto y **"Generar con IA"**.
   - Generar una descripción.
   - Hacer un pedido de prueba.

> Si algo falla, abre la consola del navegador (**Cmd + Opción + I** → pestaña *Console*) y revisa la tabla de **Problemas comunes** al final.

---

## Paso 12 — Monitoreo y Culqi

- **UptimeRobot** (uptimerobot.com, gratis): **New monitor** → tipo HTTP(s) → URL `https://hancco-api.duckdns.org/up` → cada 5 minutos. Te avisa por correo si el backend se cae.
- **Culqi:** si configuraste un webhook, cámbialo en el panel de Culqi a `https://hancco-api.duckdns.org/api/webhooks/culqi`.

---

## Paso 13 — Recién ahora: apagar Laravel Cloud

Solo cuando **todo el Paso 11 funcione**:

1. En **cloud.laravel.com** → **Resources** → borra la **base de datos** `hancco_artesani...`.
2. **Applications** → borra el entorno **production** (o la aplicación completa `hancco_artesanias_ia_assistant`). **También cobra por hora**, así que no basta con borrar la base de datos.
3. Al día siguiente revisa **Usage** y confirma que el gasto ya no sube.

🎉 **Listo.** Tu tienda queda en: frontend en Vercel (gratis) + backend en tu VPS (~$5/mes) + imágenes en R2 + IA con Gemini.

---

## 🆘 Problemas comunes

| Lo que ves | Por qué pasa | Qué hacer |
|---|---|---|
| `ping` no responde con tu IP | DuckDNS todavía no se actualizó | Espera unos minutos; revisa que pulsaste **update ip** |
| `http://TU_IP:8000` no abre | Coolify no terminó de instalarse | Entra con `ssh root@TU_IP` y vuelve a correr el instalador |
| "Conexión no segura" en `hancco-api.duckdns.org` | El certificado HTTPS aún no se emite | Espera 5 min; revisa que en Coolify el dominio empiece con `https://` |
| El deploy falla en Coolify | Error en el build o en las variables | Lee los **logs** del deploy; suele ser una variable vacía o mal copiada |
| Error 500 | Falta `APP_KEY` o los datos de la BD están mal | Revisa las variables `APP_KEY` y `DB_*` y redeploy |
| Error de **CORS** en la consola | La URL del frontend no está permitida | Revisa que `FRONTEND_URL` sea exactamente tu link de Vercel (con `https://`, sin `/` al final) |
| "Mixed content" en la consola | `API_URL` está con `http://` | En Vercel usa `https://...` y redeploy |
| "Generar con IA" se corta a los ~60 s | Timeout del proxy | Revisa los logs de la app en Coolify y avísame con el error |
| No llega el correo de recuperación | Brevo sin configurar o remitente sin verificar | Revisa el Paso 8 |
| Olvidaste la clave del admin | — | Repite el comando del Paso 9 con una clave nueva |
