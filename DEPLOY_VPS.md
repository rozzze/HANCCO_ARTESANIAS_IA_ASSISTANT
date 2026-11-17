# Guía: backend en OVH VPS-1 + Coolify (paso a paso)

Configuración final:

| Pieza | Dónde | Costo |
|---|---|---|
| Frontend (Angular) | Vercel → `https://hancco-artesanias.vercel.app` | Gratis |
| Backend (Laravel) + MySQL | **OVH VPS-1** (2 vCore, 4 GB, 40 GB, Ubuntu 24.04) con **Coolify** | ~$5.35/mes + impuestos |
| Dominio del backend | **DuckDNS** → `https://hancco-api.duckdns.org` | Gratis |
| Imágenes | Cloudflare R2 (bucket `hanccoartesanias`) | Gratis (plan free) |
| IA | Google Gemini | Por uso |

⏱️ Unas **2 horas**. Hazlo en orden.

> 🧭 **Regla de oro:** no borres nada de Laravel Cloud hasta el **Paso 14**. Hasta entonces la tienda sigue funcionando como ahora.

> 🔐 **Tus claves ya están listas** en `backend/.env.production`: R2, Gemini, Yape, WhatsApp, `APP_KEY`, contraseñas de la base de datos y la nueva clave del admin. Ese archivo **no se sube a GitHub** (está en `.gitignore`). Ábrelo en tu editor cuando la guía lo pida.

En los comandos, cambia **`TU_IP`** por la IP de tu VPS.

---

## Paso 1 — Subir los cambios del proyecto a GitHub

Coolify descarga el código desde GitHub, así que primero hay que subir el `Dockerfile` y los demás cambios. En la **Terminal** de tu Mac:

```bash
cd ~/titulacion
```

```bash
git status
```

Si aparecen archivos `.tex` como **deleted** y no los borraste tú, recupéralos:

```bash
git restore documento_sprint4_imagenes_ia.tex documento_sprint5_descripciones_ia.tex documento_sprint7_carrito_compras.tex
```

```bash
git add DEPLOY_VPS.md backend/Dockerfile backend/.dockerignore backend/.env.production.example backend/bootstrap/app.php backend/config/cors.php frontend/vercel.json frontend/scripts/set-env.mjs
```

```bash
git commit -m "Preparar despliegue del backend en OVH VPS con Coolify"
```

```bash
git push
```

✅ Subir esto **no rompe nada**: Vercel sigue apuntando a Laravel Cloud hasta el Paso 11.

---

## Paso 2 — Comprar el VPS en OVH

Configuración (la misma que ya armaste):

| Opción | Valor |
|---|---|
| Modelo | **VPS-1** (2 vCore, 4 GB RAM, 40 GB NVMe) |
| Compromiso | **Sin compromiso** |
| Ubicación | **Norteamérica** si cuesta casi lo mismo; si no, **Europa (Estrasburgo)** |
| Imagen | **Ubuntu 24.04** (sin aplicaciones) |
| Backup automático | El incluido gratis |

**Si el pedido te pide una clave SSH**, cópiala con este comando y pégala con `Cmd + V`:

```bash
pbcopy < ~/.ssh/id_ed25519.pub
```

Paga. En unos minutos te llega un **correo de OVH** con la **IP** del VPS, el usuario (**`ubuntu`**) y, si no pusiste clave SSH, una contraseña o un enlace para verla. **Anota la IP.**

---

## Paso 3 — Entrar al servidor por primera vez

En la Terminal de tu Mac:

```bash
ssh ubuntu@TU_IP
```

- Pregunta *"Are you sure you want to continue connecting?"* → escribe `yes` y Enter.
- Si pide contraseña, usa la del correo de OVH. Es posible que te obligue a **cambiarla**: escribe la actual y luego la nueva dos veces, y vuelve a entrar con `ssh ubuntu@TU_IP`.

**Si entraste con contraseña**, instala tu llave para no volver a escribirla. Sal con `exit` y en tu Mac ejecuta:

```bash
ssh-copy-id ubuntu@TU_IP
```

---

## Paso 4 — Instalar Coolify

Dentro del servidor (`ssh ubuntu@TU_IP`), conviértete en root:

```bash
sudo -i
```

Actualiza el sistema (si aparece una pantalla morada preguntando qué servicios reiniciar, presiona **Enter**):

```bash
apt update && apt upgrade -y
```

Instala Coolify (tarda unos 5 minutos):

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Al terminar muestra la URL del panel. Sal con `exit` dos veces.

---

## Paso 5 — Configurar Coolify

1. Abre `http://TU_IP:8000` en tu navegador.
2. **Registra tu usuario** administrador. Usa una contraseña **larga** y guárdala: este panel controla todo tu servidor.
3. En el asistente inicial elige **"This Machine" (localhost)** y continúa con las opciones por defecto.
4. Ve a **Servers → localhost**. Debe decir **Validated / Reachable**.
   - Si da un error de conexión SSH, revisa la fila *"localhost no valida"* en **Problemas comunes**.

---

## Paso 6 — Dominio gratis en DuckDNS

1. Entra a **duckdns.org** → inicia sesión con Google o GitHub.
2. En **sub domain** escribe `hancco-api` → **add domain**.
   - Si ya está ocupado, elige otro nombre y cámbialo en **todas** partes donde diga `hancco-api.duckdns.org`: el Paso 8, el Paso 11 y `APP_URL` en `backend/.env.production`.
3. En **current ip** escribe `TU_IP` → **update ip**.
4. Comprueba desde tu Mac (`Ctrl + C` para detener):
   ```bash
   ping hancco-api.duckdns.org
   ```
   Debe responder con tu IP.

---

## Paso 7 — Base de datos MySQL en Coolify

1. **Projects → + Add** → nombre `hancco` → entra → environment **production**.
2. **+ New → Database → MySQL**.
3. **Antes de darle Start**, en la configuración de la base pon los valores que están **arriba, en los comentarios** de `backend/.env.production`:
   | Campo en Coolify | Valor |
   |---|---|
   | Initial Database | `hancco_artesanias` |
   | Normal User | `hancco` |
   | Normal User Password | el de `backend/.env.production` |
   | Root Password | el de `backend/.env.production` |
4. **Save** → **Start**.
5. Busca **"MySQL URL (internal)"**. Se ve así: `mysql://hancco:...@`**`abc123xyz`**`:3306/hancco_artesanias`.
   El texto entre `@` y `:3306` es el **host interno**. Cópialo y pégalo en `backend/.env.production`, en la línea `DB_HOST=` (reemplaza `PEGA_AQUI_EL_HOST_INTERNO_DE_COOLIFY`).

---

## Paso 8 — Crear el backend en Coolify

### 8.1 Conectar el repositorio

En el proyecto `hancco` → **+ New → Application**:

- **Repo privado:** elige **Private Repository (with GitHub App)** y sigue el asistente. Te lleva a GitHub para autorizar a Coolify **solo** el repo `HANCCO_ARTESANIAS_IA_ASSISTANT`.
- **Repo público:** elige **Public Repository** y pega `https://github.com/rozzze/HANCCO_ARTESANIAS_IA_ASSISTANT`.

### 8.2 Configuración

| Campo | Valor |
|---|---|
| Branch | `main` |
| Build Pack | **Dockerfile** |
| Base Directory | `/backend` |
| Ports Exposes | `8080` |
| Domains | `https://hancco-api.duckdns.org` |

En **Health Checks**: actívalo, con path **`/up`** y puerto **`8080`**.

### 8.3 Variables de entorno

1. Abre `backend/.env.production` en tu editor.
2. Copia **desde la línea `APP_NAME=` hasta el final**. No copies los comentarios de arriba.
3. En Coolify → la app → **Environment Variables** → **Developer view** → pega → **Save**.
4. Revisa que `DB_HOST` tenga el host del Paso 7 y no el texto `PEGA_AQUI...`.

### 8.4 Desplegar

Pulsa **Deploy** y mira los logs. La primera vez tarda 3–5 minutos. Cuando termine, abre en el navegador:

- `https://hancco-api.duckdns.org/up` → página verde de "Application up".
- `https://hancco-api.duckdns.org/api/categorias` → `{"data":[]}`.

Si sale "conexión no segura", espera unos minutos: Coolify todavía está sacando el certificado HTTPS.

---

## Paso 9 — Crear categorías, maniquíes y admin

En Coolify → app → **Terminal** → conecta al contenedor de la app y ejecuta:

```bash
php artisan db:seed --force
```

## Paso 10 — Cambiar la clave del admin (¡obligatorio!)

El seeder crea `admin@hancco.com` con una clave de prueba y un cliente demo. En la misma terminal, reemplaza `NUEVA_CLAVE` por la **"Nueva clave del admin"** que está en los comentarios de `backend/.env.production`:

```bash
php artisan tinker --execute="App\Models\Usuario::where('correo','admin@hancco.com')->first()->update(['contrasena'=>Hash::make('NUEVA_CLAVE')]); App\Models\Usuario::where('correo','cliente@hancco.com')->delete(); echo 'OK';"
```

Debe imprimir `OK`. Desde ahora el admin entra con `admin@hancco.com` y esa clave.

---

## Paso 11 — Conectar el frontend de Vercel

1. **vercel.com** → tu proyecto → **Settings → Environment Variables**.
2. Agrega:
   - **Key:** `API_URL`
   - **Value:** `https://hancco-api.duckdns.org`
   - **Environment:** ✅ Production
3. **Save**.
4. **Deployments** → en el más reciente pulsa **⋯ → Redeploy**.
5. Cuando termine, prueba en `https://hancco-artesanias.vercel.app`:
   - [ ] Carga el catálogo y las categorías.
   - [ ] Inicias sesión como admin con la nueva clave.
   - [ ] Creas un producto y subes una foto.
   - [ ] **"Generar con IA"** con un maniquí.
   - [ ] **Generar descripción**.
   - [ ] Te registras como cliente y haces un pedido de prueba.

> Si algo falla: **Cmd + Opción + I** → pestaña **Console** → revisa los errores en rojo y busca en **Problemas comunes**.

---

## Paso 12 — Backups diarios de la base de datos (a R2)

1. **Cloudflare → R2 → Create bucket** → `hancco-backups`.
2. **R2 → Manage API tokens → Create API token** → permiso **Object Read & Write** solo para `hancco-backups`. Copia el **Access Key ID** y el **Secret Access Key**.
3. **Coolify → Storages → + Add** (S3):
   - Endpoint: `https://4bb0bdb7579fc928531a2f605c5ccee0.r2.cloudflarestorage.com`
   - Bucket: `hancco-backups`
   - Region: `auto`
   - Access Key / Secret Key: los del token nuevo
4. **Coolify → MySQL → Backups** → activa un backup programado **diario** con destino ese storage.

## Paso 13 — Opcional: correo y monitoreo

- **Correo de "Olvidé mi contraseña" (Brevo, gratis):** crea una cuenta en **brevo.com** → **Senders** → verifica `hanccoismael07@gmail.com` → **SMTP & API → SMTP** → genera una SMTP key. En Coolify cambia estas variables y haz **Redeploy**:
  ```
  MAIL_MAILER=smtp
  MAIL_HOST=smtp-relay.brevo.com
  MAIL_PORT=587
  MAIL_USERNAME=(el "Login" de Brevo)
  MAIL_PASSWORD=(la SMTP key)
  ```
- **UptimeRobot (gratis):** monitor HTTP(s) a `https://hancco-api.duckdns.org/up` cada 5 minutos. Te avisa si se cae.

---

## Paso 14 — Recién ahora: eliminar Laravel Cloud 💸

Solo si **todo el Paso 11 funcionó**:

1. **cloud.laravel.com → Resources** → elimina la base de datos `hancco_artesani...`.
2. **Applications** → elimina la aplicación `hancco_artesanias_ia_assistant` completa. **Cobra por hora** aunque borres la base de datos.
3. Al día siguiente revisa **Usage**: el gasto ya no debe subir.

> El producto que tenías en Laravel Cloud se pierde (la base de datos es nueva). Sus fotos siguen en R2; si quieres, bórralas desde Cloudflare → R2 → `hanccoartesanias` → carpeta `productos/`.

🎉 **Listo:** Vercel (gratis) + OVH (~$5.35/mes) + R2 + Gemini.

---

## 🆘 Problemas comunes

| Lo que ves | Qué hacer |
|---|---|
| `ssh` dice *Permission denied* | Usa `ubuntu@TU_IP` (no `root`). Si pusiste clave SSH en el pedido, revisa que fue la de `~/.ssh/id_ed25519.pub` |
| `http://TU_IP:8000` no abre | Entra por ssh, `sudo -i` y vuelve a correr el instalador del Paso 4 |
| **localhost no valida** en Coolify (error SSH) | Por ssh: `sudo -i`, luego `sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config && systemctl restart ssh` y en Coolify pulsa **Validate** de nuevo |
| `ping hancco-api.duckdns.org` no da tu IP | Espera 2–3 min; revisa que pulsaste **update ip** en DuckDNS |
| "Conexión no segura" en el dominio | Espera 5 min; revisa que en Coolify el dominio empiece con `https://` |
| El deploy falla | Lee los logs del deploy en Coolify; mándame captura |
| Error **500** | Revisa `APP_KEY` y `DB_HOST`/`DB_PASSWORD`; mira los **Logs** de la app en Coolify |
| `SQLSTATE[HY000] [2002]` en los logs | `DB_HOST` está mal o la MySQL no está iniciada (Paso 7) |
| Error de **CORS** en la consola | `FRONTEND_URL` debe ser exactamente `https://hancco-artesanias.vercel.app` (sin `/` al final) |
| La web sigue usando Laravel Cloud | Falta `API_URL` en Vercel o no hiciste **Redeploy** (Paso 11) |
| "Generar con IA" falla | Revisa los logs de la app; normalmente es `GEMINI_API_KEY` o R2 |
