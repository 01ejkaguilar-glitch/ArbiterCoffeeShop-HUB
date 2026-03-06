<?php

namespace App\Http\Middleware;

use Closure;
use Spatie\Permission\PermissionRegistrar;

class ClearPermissionCache
{
    public function handle($request, Closure $next)
    {
        // Ensure the Spatie permission cache is fresh for each request in tests
        if (app()->environment('testing')) {
            app()[PermissionRegistrar::class]->forgetCachedPermissions();
        }

        return $next($request);
    }
}
