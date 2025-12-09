<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Category>
 */
class CategoryFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Category::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        static $counter = 0;
        $counter++;

        $categories = [
            'Hot Beverages',
            'Cold Beverages',
            'Pastries',
            'Sandwiches',
            'Desserts',
            'Snacks',
            'Breakfast Items',
            'Lunch Specials',
            'Coffee Beans',
            'Tea Selection',
            'Specialty Drinks',
            'Seasonal Items',
        ];

        $baseName = $categories[$counter % count($categories)];
        $name = $counter > count($categories) ? $baseName . ' ' . $counter : $baseName;

        return [
            'name' => $name,
            'description' => fake()->sentence(10),
            'image_url' => fake()->imageUrl(640, 480, 'food', true),
            'sort_order' => $counter,
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the category is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
