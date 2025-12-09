<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create roles
        $roles = [
            'super-admin' => 'Super Administrator',
            'admin' => 'Administrator',
            'workforce-manager' => 'Workforce Manager',
            'barista' => 'Barista',
            'customer' => 'Customer',
        ];

        foreach ($roles as $slug => $name) {
            Role::firstOrCreate(['name' => $slug]);
            $this->command->info("Role '{$slug}' created or already exists.");
        }

        // Create basic permissions
        $permissions = [
            'view products',
            'manage products',
            'view orders',
            'manage orders',
            'view customers',
            'manage customers',
            'view employees',
            'manage employees',
            'view analytics',
            'manage settings',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
            $this->command->info("Permission '{$permission}' created or already exists.");
        }

        // Assign permissions to roles
        $superAdmin = Role::findByName('super-admin');
        $superAdmin->givePermissionTo(Permission::all());

        $admin = Role::findByName('admin');
        $admin->givePermissionTo([
            'view products', 'manage products',
            'view orders', 'manage orders',
            'view customers', 'manage customers',
            'view analytics', 'manage settings'
        ]);

        $workforceManager = Role::findByName('workforce-manager');
        $workforceManager->givePermissionTo([
            'view employees', 'manage employees',
            'view analytics'
        ]);

        $barista = Role::findByName('barista');
        $barista->givePermissionTo([
            'view products', 'view orders', 'manage orders'
        ]);

        $customer = Role::findByName('customer');
        $customer->givePermissionTo([
            'view products', 'view orders'
        ]);

        $this->command->info('Roles and permissions created successfully!');
    }
}
