<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CartItem>
 */
class CartItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'cart_id' => \App\Models\Cart::factory(),
            'product_id' => \App\Models\Product::factory(),
            'quantity' => $this->faker->numberBetween(1, 5),
            'customizations' => $this->faker->optional(0.3)->randomElements([
                'extra_shot' => true,
                'size' => $this->faker->randomElement(['small', 'medium', 'large']),
                'milk_type' => $this->faker->randomElement(['whole', 'skim', 'almond', 'oat']),
            ]),
        ];
    }
}
