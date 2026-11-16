<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_unique(array_filter(array_map('trim', array_merge(
        [
            'http://localhost:4200',
            'http://127.0.0.1:4200',
            'https://hancco-artesanias.vercel.app',
            (string) env('FRONTEND_URL', ''),
        ],
        explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')),
    ))))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];