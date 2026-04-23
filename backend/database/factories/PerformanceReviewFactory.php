<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PerformanceReview>
 */
class PerformanceReviewFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $speedScore = fake()->randomFloat(2, 1, 5);
        $qualityScore = fake()->randomFloat(2, 1, 5);
        $attendanceScore = fake()->randomFloat(2, 1, 5);
        $teamworkScore = fake()->randomFloat(2, 1, 5);
        $customerServiceScore = fake()->randomFloat(2, 1, 5);
        
        $overallScore = ($speedScore + $qualityScore + $attendanceScore + $teamworkScore + $customerServiceScore) / 5;
        
        $periodStart = Carbon::now()->subMonths(fake()->numberBetween(1, 12));
        $periodEnd = (clone $periodStart)->addMonth();
        
        return [
            'employee_id' => Employee::factory(),
            'reviewer_id' => User::factory(),
            'review_period_start' => $periodStart,
            'review_period_end' => $periodEnd,
            'speed_score' => round($speedScore, 2),
            'quality_score' => round($qualityScore, 2),
            'attendance_score' => round($attendanceScore, 2),
            'teamwork_score' => round($teamworkScore, 2),
            'customer_service_score' => round($customerServiceScore, 2),
            'overall_score' => round($overallScore, 2),
            'strengths' => fake()->sentence(),
            'areas_for_improvement' => fake()->sentence(),
            'goals' => fake()->sentence(),
            'comments' => fake()->paragraph(),
        ];
    }
}
