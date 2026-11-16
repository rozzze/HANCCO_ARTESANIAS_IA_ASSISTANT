# Imagen de produccion del backend (Laravel 11) para desplegar en un VPS con Coolify.
# PHP 8.4 porque composer.lock incluye paquetes de Symfony que exigen PHP >= 8.4.1.
# La imagen trae Nginx + PHP-FPM y escucha en el puerto 8080.
FROM serversideup/php:8.4-fpm-nginx

ENV PHP_OPCACHE_ENABLE=1 \
    PHP_MEMORY_LIMIT=256M \
    # Gemini puede tardar hasta GEMINI_TIMEOUT (120 s) en generar una imagen.
    PHP_MAX_EXECUTION_TIME=180 \
    PHP_UPLOAD_MAX_FILE_SIZE=12M \
    PHP_POST_MAX_SIZE=12M \
    # Al arrancar el contenedor: storage:link, migrate --force y cache de config/rutas/vistas.
    AUTORUN_ENABLED=true

WORKDIR /var/www/html

# 1) Dependencias primero, para aprovechar la cache de Docker entre despliegues.
COPY --chown=www-data:www-data composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-scripts --no-autoloader

# 2) Codigo de la aplicacion.
COPY --chown=www-data:www-data . .

RUN mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views \
        storage/logs bootstrap/cache \
    && composer dump-autoload --optimize --no-dev

EXPOSE 8080
