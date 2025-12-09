<?php

namespace Database\Seeders;

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

        // Create customer user
        $customer = User::create([
            'name' => 'John Doe',
            'email' => 'customer@arbiter.com',
            'password' => bcrypt('password123'),
        ]);
        $customer->assignRole('customer');
        $this->command->info("Customer user created: customer@arbiter.com / password123");

        // Seed announcements (after admin user is created)
        $this->call(AnnouncementSeeder::class);

        $this->command->info('Database seeding completed successfully!');
    }
}
