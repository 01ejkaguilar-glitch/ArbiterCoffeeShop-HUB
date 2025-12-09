<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\OrderItem>
 */
class OrderItemFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = OrderItem::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 5);
        $unitPrice = fake()->randomFloat(2, 2.50, 15.00);

        return [
            'order_id' => Order::factory(),
            'product_id' => Product::factory(),
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'customizations' => [
                'size' => fake()->randomElement(['Small', 'Medium', 'Large']),
                'milk' => fake()->randomElement(['Regular', 'Soy', 'Almond']),
            ],
        ];
    }

    /**
     * Indicate that the order item has no customizations.
     */
    public function noCustomizations(): static
    {
        return $this->state(fn (array $attributes) => [
            'customizations' => null,
        ]);
    }
}
