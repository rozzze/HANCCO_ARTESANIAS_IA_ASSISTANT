<?php

namespace App\Providers;

use App\Services\CloudflareR2Service;
use App\Services\GeminiService;
use App\Services\ImageEnhancementService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(CloudflareR2Service::class);
        $this->app->singleton(GeminiService::class);
        $this->app->singleton(ImageEnhancementService::class);
    }

    public function boot(): void
    {
        //
    }
}