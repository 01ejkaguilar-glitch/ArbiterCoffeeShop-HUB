<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\Concerns\InteractsWithTestCaseLifecycle;

abstract class TestCase extends BaseTestCase
{
    use InteractsWithTestCaseLifecycle;
    use TestHelpers;

    /**
     * Setup the test environment.
     */
    protected function setUp(): void
    {
        parent::setUp();


        // Ensure default auth guard during tests uses Sanctum to match route middleware
        config(['auth.defaults.guard' => 'sanctum']);

        // Reset cached roles and permissions for Spatie Permission
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
        // Ensure roles and permissions exist for tests
        $this->setupRolesAndPermissions();
    }

    /**
     * Check if the environment's image library can decode images.
     * This attempts to decode a small in-memory PNG using Intervention Image.
     */
    protected function canProcessImages(): bool
    {
        try {
            // Configure Intervention ImageManager to prefer Imagick if available
            $manager = extension_loaded('imagick')
                ? \Intervention\Image\ImageManager::imagick()
                : \Intervention\Image\ImageManager::gd();

            // 1x1 PNG base64
            $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9YJ7swAAAABJRU5ErkJggg==');
            $manager->read($png);

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
