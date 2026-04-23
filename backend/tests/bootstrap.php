<?php

// Include composer autoload
require __DIR__ . '/../vendor/autoload.php';

// Polyfill imagejpeg when GD extension is not available to allow Laravel FileFactory to generate images in tests
if (!function_exists('imagejpeg')) {
    function imagejpeg($image, $filename = null, $quality = null)
    {
        if ($filename !== null) {
            // Write a valid 1x1 JPEG image so image libraries can decode it during tests
            $jpg = base64_decode(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9YJ7swAAAABJRU5ErkJggg=='
            );
            file_put_contents($filename, $jpg);
        }

        return true;
    }

}

// Bootstrap the Laravel application so we can create test roles early
/**
 * Bootstrap the Laravel application so we can create test roles early.
 * If the roles table doesn't exist yet, run migrations once to ensure the
 * required tables are present for seeding roles/permissions.
 */
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Ensure database schema is migrated for the test environment
$kernel->call('migrate', ['--force' => true]);

// During testing, ensure every API request clears the Spatie permission cache so
// role assignments performed in test setUp methods are recognized by middleware.
if (app()->environment('testing')) {
    $router = $app->make('\Illuminate\Routing\Router');
    $router->pushMiddlewareToGroup('api', \App\Http\Middleware\ClearPermissionCache::class);
}

// Only attempt to create roles if the roles table exists (migrations may not have run yet)
if (\Illuminate\Support\Facades\Schema::hasTable('roles')) {
    // Clear Spatie cache then ensure roles exist for 'sanctum' guard
    app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

    $roles = ['super-admin', 'admin', 'manager', 'workforce-manager', 'barista', 'customer'];
    foreach (['web', 'sanctum'] as $guard) {
        foreach ($roles as $role) {
            \Spatie\Permission\Models\Role::firstOrCreate(['name' => $role, 'guard_name' => $guard]);
        }
    }

    app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

    // Sanity check: ensure at least the 'admin' role exists for 'sanctum'
    if (!\Spatie\Permission\Models\Role::where('name', 'admin')->where('guard_name', 'sanctum')->exists()) {
        fwrite(STDERR, "Required roles for 'sanctum' guard not present in test database.\n");
        exit(1);
    }
}
