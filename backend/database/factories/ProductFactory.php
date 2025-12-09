<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Product::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        static $counter = 0;
        $counter++;

        $productNames = [
            'Espresso',
            'Cappuccino',
            'Latte',
            'Americano',
            'Mocha',
            'Iced Coffee',
            'Cold Brew',
            'Croissant',
            'Muffin',
            'Bagel',
            'Danish',
            'Cheesecake',
            'Brownie',
            'Cookie',
            'Club Sandwich',
            'BLT Sandwich',
            'Tuna Sandwich',
            'Macchiato',
            'Flat White',
            'Cortado',
        ];

        $baseName = $productNames[$counter % count($productNames)];
        $name = $counter > count($productNames) ? $baseName . ' #' . $counter : $baseName;

        return [
            'category_id' => Category::factory(),
            'name' => $name,
            'description' => fake()->sentence(12),
            'price' => fake()->randomFloat(2, 2.50, 15.00),
            'image_url' => fake()->imageUrl(640, 480, 'food', true),
            'stock_quantity' => fake()->numberBetween(10, 100),
            'is_available' => true,
            'customization_options' => [
                'size' => ['Small', 'Medium', 'Large'],
                'milk' => ['Regular', 'Soy', 'Almond', 'Oat'],
                'extras' => ['Extra Shot', 'Whipped Cream', 'Vanilla Syrup'],
            ],
        ];
    }

    /**
     * Indicate that the product is unavailable.
     */
    public function unavailable(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_available' => false,
            'stock_quantity' => 0,
        ]);
    }

    /**
     * Indicate that the product is out of stock.
     */
    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock_quantity' => 0,
        ]);
    }

    /**
     * Indicate that the product has no customization options.
     */
    public function noCustomization(): static
    {
        return $this->state(fn (array $attributes) => [
            'customization_options' => null,
        ]);
    }
}
