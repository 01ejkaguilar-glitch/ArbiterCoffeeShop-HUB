<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Employee>
 */
class EmployeeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'employee_number' => 'EMP-' . fake()->unique()->numberBetween(1000, 9999),
            'position' => fake()->randomElement(['Barista', 'Senior Barista', 'Shift Supervisor', 'Store Manager']),
            'department' => fake()->randomElement(['Operations', 'Customer Service', 'Production']),
            'hire_date' => fake()->dateTimeBetween('-2 years', 'now'),
            'salary' => fake()->randomFloat(2, 15000, 40000),
            'status' => 'active',
            'emergency_contact_name' => fake()->name(),
            'emergency_contact_phone' => fake()->phoneNumber(),
        ];
    }
}
