<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Order::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 10.00, 100.00);
        $deliveryFee = fake()->randomElement([0.00, 2.50, 5.00]);
        $totalAmount = $subtotal + $deliveryFee;

        return [
            'user_id' => User::factory(),
            'order_number' => 'ORD-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6)),
            'status' => fake()->randomElement(['pending', 'preparing', 'ready', 'completed', 'cancelled']),
            'order_type' => fake()->randomElement(['dine-in', 'take-out', 'delivery']),
            'subtotal' => $subtotal,
            'delivery_fee' => $deliveryFee,
            'total_amount' => $totalAmount,
            'payment_method' => fake()->randomElement(['cash', 'gcash', 'card']),
            'payment_status' => fake()->randomElement(['pending', 'paid', 'failed']),
            'delivery_address' => fake()->address(),
            'special_instructions' => fake()->optional()->sentence(),
            'prepared_at' => null,
            'completed_at' => null,
        ];
    }

    /**
     * Indicate that the order is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'payment_status' => 'pending',
            'prepared_at' => null,
            'completed_at' => null,
        ]);
    }

    /**
     * Indicate that the order is preparing.
     */
    public function preparing(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'preparing',
            'payment_status' => 'paid',
            'prepared_at' => null,
            'completed_at' => null,
        ]);
    }

    /**
     * Indicate that the order is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'payment_status' => 'paid',
            'prepared_at' => fake()->dateTimeBetween('-1 hour', '-30 minutes'),
            'completed_at' => fake()->dateTimeBetween('-30 minutes', 'now'),
        ]);
    }

    /**
     * Indicate that the order is for dine-in.
     */
    public function dineIn(): static
    {
        return $this->state(fn (array $attributes) => [
            'order_type' => 'dine-in',
            'delivery_fee' => 0.00,
            'delivery_address' => null,
            'total_amount' => $attributes['subtotal'],
        ]);
    }

    /**
     * Indicate that the order is for delivery.
     */
    public function delivery(): static
    {
        return $this->state(fn (array $attributes) => [
            'order_type' => 'delivery',
            'delivery_fee' => 5.00,
            'total_amount' => $attributes['subtotal'] + 5.00,
        ]);
    }
}
