<?php

return [

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-flash-latest'),
        'model_image' => env('GEMINI_MODEL_IMAGE', 'gemini-2.5-flash-image'),
        'timeout' => (int) env('GEMINI_TIMEOUT', 120),
    ],

    'culqi' => [
        'public_key' => env('CULQI_PUBLIC_KEY'),
        'secret_key' => env('CULQI_SECRET_KEY'),
        'env' => env('CULQI_ENV', 'sandbox'),
    ],

    'cloudflare_r2' => [
        'account_id' => env('CLOUDFLARE_R2_ACCOUNT_ID'),
        'bucket' => env('CLOUDFLARE_R2_BUCKET'),
        'public_url' => env('CLOUDFLARE_R2_PUBLIC_URL'),
    ],

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
        'routes' => [
            'incoming_webhook' => env('SLACK_INCOMING_WEBHOOK_URL'),
            'signing_secret' => env('SLACK_SIGNING_SECRET'),
        ],
    ],
];