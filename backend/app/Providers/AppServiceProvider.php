<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Connection;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
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
