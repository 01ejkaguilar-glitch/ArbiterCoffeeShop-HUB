<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Worldwide Specialty Coffee',
                'description' => 'Origin-specific single-origin coffees with various brewing methods',
                'image_url' => '/assets/categories/specialty-coffee.jpg',
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Global Signature Beverages',
                'description' => 'Specialty lattes and creative coffee drinks',
                'image_url' => '/assets/categories/signature-beverages.jpg',
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Japanese Rice Bowls',
                'description' => 'Authentic Japanese donburi selections',
                'image_url' => '/assets/categories/rice-bowls.jpg',
                'sort_order' => 3,
                'is_active' => true,
            ],
            [
                'name' => 'Japanese Noodles',
                'description' => 'Ramen, udon, and soba options',
                'image_url' => '/assets/categories/noodles.jpg',
                'sort_order' => 4,
                'is_active' => true,
            ],
            [
                'name' => 'Japanese Combo Set',
                'description' => 'Complete meal combinations',
                'image_url' => '/assets/categories/combo-sets.jpg',
                'sort_order' => 5,
                'is_active' => true,
            ],
            [
                'name' => 'Japanese Desserts',
                'description' => 'Traditional Japanese sweets and pastries',
                'image_url' => '/assets/categories/desserts.jpg',
                'sort_order' => 6,
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
            $this->command->info("Category '{$category['name']}' created.");
        }

        $this->command->info('All categories created successfully!');
    }
}
