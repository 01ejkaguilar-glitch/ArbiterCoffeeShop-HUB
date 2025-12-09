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
        // Create roles using firstOrCreate to avoid duplicate key errors
        Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'workforce-manager', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'barista', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);

        // Create basic permissions using firstOrCreate
        Permission::firstOrCreate(['name' => 'manage-users', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'manage-products', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'manage-orders', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'view-analytics', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'manage-workforce', 'guard_name' => 'web']);
    }
}
