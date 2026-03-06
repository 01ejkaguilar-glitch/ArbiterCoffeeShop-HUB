<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles and permissions first
        $this->call(RoleSeeder::class);
        
        // Seed categories, products, coffee beans, and announcements
        $this->call([
            CategorySeeder::class,
            ProductSeeder::class,
            CoffeeBeanSeeder::class,
            InventoryItemSeeder::class,
        ]);

        // Create test users with roles
        $this->command->info('Creating test users...');

        // Create admin user
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@arbiter.com',
            'password' => bcrypt('password123'),
        ]);
        $admin->assignRole('admin');
        $this->command->info("Admin user created: admin@arbiter.com / password123");

        // Create barista user
        $barista = User::create([
            'name' => 'Barista User',
            'email' => 'barista@arbiter.com',
            'password' => bcrypt('password123'),
        ]);
        $barista->assignRole('barista');
        $this->command->info("Barista user created: barista@arbiter.com / password123");

        // Create employee record for the barista test user so self-service
        // endpoints (/employee/tasks, /employee/shifts, /employee/attendance)
        // return data instead of 404.
        Employee::create([
            'user_id'    => $barista->id,
            'employee_number' => 'EMP-001',
            'position'   => 'Barista',
            'department' => 'Operations',
            'hire_date'  => now()->subYear()->toDateString(),
            'salary'     => 25000.00,
            'status'     => 'active',
        ]);
        $this->command->info("Employee record created for barista test user.");

        // Create customer user
        $customer = User::create([
            'name' => 'John Doe',
            'email' => 'customer@arbiter.com',
            'password' => bcrypt('password123'),
        ]);
        $customer->assignRole('customer');
        $this->command->info("Customer user created: customer@arbiter.com / password123");

        // Create kitchen staff user
        $kitchenStaff = User::create([
            'name' => 'Kitchen Staff User',
            'email' => 'kitchen@arbiter.com',
            'password' => bcrypt('password123'),
        ]);
        $kitchenStaff->assignRole('kitchen-staff');
        $this->command->info("Kitchen staff user created: kitchen@arbiter.com / password123");

        // Create employee record for the kitchen staff test user
        Employee::create([
            'user_id'    => $kitchenStaff->id,
            'employee_number' => 'EMP-002',
            'position'   => 'Kitchen Staff',
            'department' => 'Kitchen',
            'hire_date'  => now()->subMonths(6)->toDateString(),
            'salary'     => 22000.00,
            'status'     => 'active',
        ]);
        $this->command->info("Employee record created for kitchen staff test user.");

        // Seed announcements (after admin user is created)
        $this->call(AnnouncementSeeder::class);

        $this->command->info('Database seeding completed successfully!');
    }
}
