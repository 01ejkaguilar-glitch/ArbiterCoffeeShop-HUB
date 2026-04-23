<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LeaveRequest>
 */
class LeaveRequestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $types = ['sick', 'vacation', 'personal', 'emergency', 'bereavement'];
        $startDate = Carbon::now()->addDays(fake()->numberBetween(1, 30));
        $endDate = (clone $startDate)->addDays(fake()->numberBetween(1, 7));
        
        return [
            'employee_id' => Employee::factory(),
            'type' => fake()->randomElement($types),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'days_requested' => $startDate->diffInDays($endDate) + 1,
            'reason' => fake()->sentence(),
            'status' => 'pending',
        ];
    }
}
