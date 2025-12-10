<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Connection;
use App\Services\RecommendationService;
use App\Services\CustomerInsightsService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register Recommendation Service
        $this->app->singleton(RecommendationService::class, function ($app) {
            return new RecommendationService();
        });

        // Register Customer Insights Service
        $this->app->singleton(CustomerInsightsService::class, function ($app) {
            return new CustomerInsightsService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Fix for PHP 8.4 SQLite transaction issues
        if (version_compare(PHP_VERSION, '8.4.0', '>=')) {
            Connection::resolverFor('sqlite', function ($connection, $database, $prefix, $config) {
                // Override transaction_mode for PHP 8.4 compatibility
                $config['transaction_mode'] = null;
                return new \Illuminate\Database\SQLiteConnection($connection, $database, $prefix, $config);
            });
        }
    }
}
