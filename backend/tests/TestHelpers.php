<?php

namespace Tests;

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

trait TestHelpers
{
    /**
     * Setup roles and permissions for tests
     */
    protected function setupRolesAndPermissions(): void
    {
        // Ensure Spatie cache is cleared before modifying roles/permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create roles for both 'web' and 'sanctum' guards to ensure middleware checks pass in tests
        $roles = ['super-admin', 'admin', 'manager', 'workforce-manager', 'barista', 'customer'];
        foreach (['web', 'sanctum'] as $guard) {
            foreach ($roles as $role) {
                Role::firstOrCreate(['name' => $role, 'guard_name' => $guard]);
            }
        }

        $permissions = ['manage-users', 'manage-products', 'manage-orders', 'view-analytics', 'manage-workforce'];
        foreach (['web', 'sanctum'] as $guard) {
            foreach ($permissions as $perm) {
                Permission::firstOrCreate(['name' => $perm, 'guard_name' => $guard]);
            }
        }

        // Clear the cache again to ensure fresh permission lookup in tests
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
