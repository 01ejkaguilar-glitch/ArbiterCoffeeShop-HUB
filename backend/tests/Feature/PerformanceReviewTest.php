<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Employee;
use App\Models\PerformanceReview;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class PerformanceReviewTest extends TestCase
{
    use RefreshDatabase, \Tests\TestHelpers;

    protected $manager;
    protected $admin;
    protected $employee;
    protected $employeeRecord;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setupRolesAndPermissions();

        // Create manager user
        $this->manager = User::factory()->create();
        $this->manager->assignRole('manager');

        // Create admin user
        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        // Create employee user
        $this->employee = User::factory()->create();
        $this->employee->assignRole('barista');

        // Create employee record
        $this->employeeRecord = Employee::factory()->create([
            'user_id' => $this->employee->id,
        ]);
    }

    public function test_manager_can_submit_performance_review()
    {
        Sanctum::actingAs($this->manager);

        $response = $this->postJson('/api/v1/workforce/performance/reviews', [
            'employee_id' => $this->employeeRecord->id,
            'review_period_start' => now()->subMonth()->startOfMonth()->format('Y-m-d'),
            'review_period_end' => now()->subMonth()->endOfMonth()->format('Y-m-d'),
            'speed_score' => 4.5,
            'quality_score' => 4.0,
            'attendance_score' => 5.0,
            'teamwork_score' => 4.5,
            'customer_service_score' => 4.0,
            'strengths' => 'Excellent speed and attendance',
            'areas_for_improvement' => 'Could improve quality consistency',
            'goals' => 'Maintain current performance level',
            'comments' => 'Great work overall',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Performance review submitted successfully',
            ])
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'employee_id',
                    'reviewer_id',
                    'review_period_start',
                    'review_period_end',
                    'speed_score',
                    'quality_score',
                    'attendance_score',
                    'teamwork_score',
                    'customer_service_score',
                    'overall_score',
                ],
            ]);

        $this->assertDatabaseHas('performance_reviews', [
            'employee_id' => $this->employeeRecord->id,
            'reviewer_id' => $this->manager->id,
            'overall_score' => 4.40, // Average of all scores
        ]);
    }

    public function test_employee_cannot_submit_performance_review()
    {
        Sanctum::actingAs($this->employee);

        $response = $this->postJson('/api/v1/workforce/performance/reviews', [
            'employee_id' => $this->employeeRecord->id,
            'review_period_start' => now()->subMonth()->startOfMonth()->format('Y-m-d'),
            'review_period_end' => now()->subMonth()->endOfMonth()->format('Y-m-d'),
            'speed_score' => 4.0,
            'quality_score' => 4.0,
            'attendance_score' => 4.0,
            'teamwork_score' => 4.0,
            'customer_service_score' => 4.0,
        ]);

        $response->assertStatus(403);
    }

    public function test_validation_for_performance_review()
    {
        Sanctum::actingAs($this->manager);

        $response = $this->postJson('/api/v1/workforce/performance/reviews', [
            'employee_id' => 999999,
            'review_period_start' => 'invalid_date',
            'speed_score' => 10, // Invalid: max is 5
            'quality_score' => -1, // Invalid: min is 0
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed',
            ])
            ->assertJsonStructure([
                'errors' => [
                    'employee_id',
                    'review_period_start',
                    'review_period_end',
                    'speed_score',
                    'quality_score',
                    'attendance_score',
                    'teamwork_score',
                    'customer_service_score',
                ],
            ]);
    }

    public function test_cannot_submit_overlapping_performance_review()
    {
        Sanctum::actingAs($this->manager);

        // Create existing review
        PerformanceReview::create([
            'employee_id' => $this->employeeRecord->id,
            'reviewer_id' => $this->manager->id,
            'review_period_start' => now()->subMonths(2)->startOfMonth(),
            'review_period_end' => now()->subMonth()->endOfMonth(),
            'speed_score' => 4.0,
            'quality_score' => 4.0,
            'attendance_score' => 4.0,
            'teamwork_score' => 4.0,
            'customer_service_score' => 4.0,
            'overall_score' => 4.0,
        ]);

        // Try to submit overlapping review
        $response = $this->postJson('/api/v1/workforce/performance/reviews', [
            'employee_id' => $this->employeeRecord->id,
            'review_period_start' => now()->subMonths(2)->addDays(15)->format('Y-m-d'),
            'review_period_end' => now()->subMonth()->addDays(15)->format('Y-m-d'),
            'speed_score' => 3.5,
            'quality_score' => 3.5,
            'attendance_score' => 3.5,
            'teamwork_score' => 3.5,
            'customer_service_score' => 3.5,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Performance review period overlaps with existing review',
            ]);
    }

    public function test_manager_can_get_employee_performance_data()
    {
        Sanctum::actingAs($this->manager);

        // Create multiple reviews
        PerformanceReview::factory()->count(5)->create([
            'employee_id' => $this->employeeRecord->id,
        ]);

        $response = $this->getJson("/api/v1/workforce/performance/{$this->employeeRecord->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    'employee',
                    'total_reviews',
                    'average_scores',
                    'latest_review',
                    'performance_trend',
                    'all_reviews',
                ],
            ]);

        $this->assertEquals(5, $response->json('data.total_reviews'));
    }

    public function test_employee_can_view_own_performance_data()
    {
        Sanctum::actingAs($this->employee);

        PerformanceReview::factory()->create([
            'employee_id' => $this->employeeRecord->id,
        ]);

        $response = $this->getJson("/api/v1/workforce/performance/{$this->employeeRecord->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_employee_cannot_view_other_performance_data()
    {
        Sanctum::actingAs($this->employee);

        $otherEmployee = Employee::factory()->create();

        $response = $this->getJson("/api/v1/workforce/performance/{$otherEmployee->id}");

        $response->assertStatus(403);
    }

    public function test_manager_can_list_all_performance_reviews()
    {
        Sanctum::actingAs($this->manager);

        PerformanceReview::factory()->count(10)->create();

        $response = $this->getJson('/api/v1/workforce/performance/reviews');

        $response->assertStatus(200)
            ->assertJsonCount(10, 'data.data');
    }

    public function test_employee_can_list_own_performance_reviews()
    {
        Sanctum::actingAs($this->employee);

        PerformanceReview::factory()->count(3)->create([
            'employee_id' => $this->employeeRecord->id,
        ]);

        PerformanceReview::factory()->create(); // Another employee's review

        $response = $this->getJson('/api/v1/workforce/performance/reviews');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data.data');
    }

    public function test_can_filter_performance_reviews_by_employee()
    {
        Sanctum::actingAs($this->manager);

        PerformanceReview::factory()->count(3)->create([
            'employee_id' => $this->employeeRecord->id,
        ]);

        PerformanceReview::factory()->count(2)->create();

        $response = $this->getJson("/api/v1/workforce/performance/reviews?employee_id={$this->employeeRecord->id}");

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data.data');
    }

    public function test_manager_can_update_performance_review()
    {
        Sanctum::actingAs($this->manager);

        $review = PerformanceReview::factory()->create([
            'employee_id' => $this->employeeRecord->id,
            'speed_score' => 3.0,
            'quality_score' => 3.0,
        ]);

        $response = $this->putJson("/api/v1/workforce/performance/reviews/{$review->id}", [
            'speed_score' => 4.5,
            'quality_score' => 4.0,
            'comments' => 'Updated after reconsideration',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Performance review updated successfully',
            ]);

        $this->assertDatabaseHas('performance_reviews', [
            'id' => $review->id,
            'speed_score' => 4.5,
            'quality_score' => 4.0,
            'comments' => 'Updated after reconsideration',
        ]);
    }

    public function test_employee_cannot_update_performance_review()
    {
        Sanctum::actingAs($this->employee);

        $review = PerformanceReview::factory()->create([
            'employee_id' => $this->employeeRecord->id,
        ]);

        $response = $this->putJson("/api/v1/workforce/performance/reviews/{$review->id}", [
            'speed_score' => 5.0,
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_delete_performance_review()
    {
        Sanctum::actingAs($this->admin);

        $review = PerformanceReview::factory()->create();

        $response = $this->deleteJson("/api/v1/workforce/performance/reviews/{$review->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Performance review deleted successfully',
            ]);

        $this->assertDatabaseMissing('performance_reviews', [
            'id' => $review->id,
        ]);
    }

    public function test_manager_cannot_delete_performance_review()
    {
        Sanctum::actingAs($this->manager);

        $review = PerformanceReview::factory()->create();

        $response = $this->deleteJson("/api/v1/workforce/performance/reviews/{$review->id}");

        $response->assertStatus(403);
    }

    public function test_unauthenticated_cannot_access_performance_reviews()
    {
        $response = $this->getJson('/api/v1/workforce/performance/reviews');

        $response->assertStatus(401);
    }

    public function test_overall_score_is_calculated_correctly()
    {
        Sanctum::actingAs($this->manager);

        $response = $this->postJson('/api/v1/workforce/performance/reviews', [
            'employee_id' => $this->employeeRecord->id,
            'review_period_start' => now()->subMonth()->format('Y-m-d'),
            'review_period_end' => now()->format('Y-m-d'),
            'speed_score' => 5.0,
            'quality_score' => 4.0,
            'attendance_score' => 3.0,
            'teamwork_score' => 2.0,
            'customer_service_score' => 1.0,
        ]);

        $response->assertStatus(201);

        // Overall score should be (5+4+3+2+1)/5 = 3.0
        $this->assertDatabaseHas('performance_reviews', [
            'employee_id' => $this->employeeRecord->id,
            'overall_score' => 3.00,
        ]);
    }
}
