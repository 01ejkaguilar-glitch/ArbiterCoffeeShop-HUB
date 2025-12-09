<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Employee;
use App\Models\LeaveRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Carbon\Carbon;

class LeaveRequestTest extends TestCase
{
    use RefreshDatabase, \Tests\TestHelpers;

    protected $manager;
    protected $employee;
    protected $employeeRecord;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setupRolesAndPermissions();

        // Create manager user
        $this->manager = User::factory()->create();
        $this->manager->assignRole('manager');

        // Create employee user
        $this->employee = User::factory()->create();
        $this->employee->assignRole('barista');

        // Create employee record
        $this->employeeRecord = Employee::factory()->create([
            'user_id' => $this->employee->id,
        ]);
    }

    public function test_employee_can_submit_leave_request()
    {
        Sanctum::actingAs($this->employee);

        $response = $this->postJson('/api/v1/workforce/leave-requests', [
            'employee_id' => $this->employeeRecord->id,
            'type' => 'vacation',
            'start_date' => now()->addDays(7)->format('Y-m-d'),
            'end_date' => now()->addDays(9)->format('Y-m-d'),
            'reason' => 'Family vacation',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Leave request submitted successfully',
            ])
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'employee_id',
                    'type',
                    'start_date',
                    'end_date',
                    'days_requested',
                    'reason',
                    'status',
                ],
            ]);

        $this->assertDatabaseHas('leave_requests', [
            'employee_id' => $this->employeeRecord->id,
            'type' => 'vacation',
            'days_requested' => 3,
            'status' => 'pending',
        ]);
    }

    public function test_employee_cannot_submit_leave_request_for_other_employee()
    {
        Sanctum::actingAs($this->employee);

        $otherEmployee = Employee::factory()->create();

        $response = $this->postJson('/api/v1/workforce/leave-requests', [
            'employee_id' => $otherEmployee->id,
            'type' => 'sick',
            'start_date' => now()->addDays(1)->format('Y-m-d'),
            'end_date' => now()->addDays(2)->format('Y-m-d'),
            'reason' => 'Medical appointment',
        ]);

        $response->assertStatus(403);
    }

    public function test_manager_can_submit_leave_request_for_any_employee()
    {
        Sanctum::actingAs($this->manager);

        $response = $this->postJson('/api/v1/workforce/leave-requests', [
            'employee_id' => $this->employeeRecord->id,
            'type' => 'personal',
            'start_date' => now()->addDays(14)->format('Y-m-d'),
            'end_date' => now()->addDays(14)->format('Y-m-d'),
            'reason' => 'Personal matter',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_cannot_submit_overlapping_leave_request()
    {
        Sanctum::actingAs($this->employee);

        // Create existing leave request
        LeaveRequest::create([
            'employee_id' => $this->employeeRecord->id,
            'type' => 'vacation',
            'start_date' => now()->addDays(10),
            'end_date' => now()->addDays(15),
            'days_requested' => 6,
            'reason' => 'Existing vacation',
            'status' => 'pending',
        ]);

        // Try to submit overlapping request
        $response = $this->postJson('/api/v1/workforce/leave-requests', [
            'employee_id' => $this->employeeRecord->id,
            'type' => 'sick',
            'start_date' => now()->addDays(12)->format('Y-m-d'),
            'end_date' => now()->addDays(13)->format('Y-m-d'),
            'reason' => 'Sick leave',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Leave request overlaps with existing request',
            ]);
    }

    public function test_validation_for_leave_request()
    {
        Sanctum::actingAs($this->employee);

        $response = $this->postJson('/api/v1/workforce/leave-requests', [
            'employee_id' => $this->employeeRecord->id,
            'type' => 'invalid_type',
            'start_date' => 'invalid_date',
            'end_date' => now()->subDays(1)->format('Y-m-d'),
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed',
            ])
            ->assertJsonStructure([
                'errors' => ['type', 'start_date', 'reason']
            ]);
    }

    public function test_employee_can_list_own_leave_requests()
    {
        Sanctum::actingAs($this->employee);

        // Create leave requests
        LeaveRequest::factory()->count(3)->create([
            'employee_id' => $this->employeeRecord->id,
        ]);

        LeaveRequest::factory()->create(); // Another employee's request

        $response = $this->getJson('/api/v1/workforce/leave-requests');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonCount(3, 'data.data');
    }

    public function test_manager_can_list_all_leave_requests()
    {
        Sanctum::actingAs($this->manager);

        LeaveRequest::factory()->count(5)->create();

        $response = $this->getJson('/api/v1/workforce/leave-requests');

        $response->assertStatus(200)
            ->assertJsonCount(5, 'data.data');
    }

    public function test_can_filter_leave_requests_by_status()
    {
        Sanctum::actingAs($this->manager);

        LeaveRequest::factory()->count(2)->create(['status' => 'pending']);
        LeaveRequest::factory()->count(3)->create(['status' => 'approved']);

        $response = $this->getJson('/api/v1/workforce/leave-requests?status=pending');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data.data');
    }

    public function test_manager_can_approve_leave_request()
    {
        Sanctum::actingAs($this->manager);

        $leaveRequest = LeaveRequest::factory()->create([
            'employee_id' => $this->employeeRecord->id,
            'status' => 'pending',
        ]);

        $response = $this->putJson("/api/v1/workforce/leave-requests/{$leaveRequest->id}", [
            'status' => 'approved',
            'review_notes' => 'Approved for vacation',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Leave request updated successfully',
            ]);

        $this->assertDatabaseHas('leave_requests', [
            'id' => $leaveRequest->id,
            'status' => 'approved',
            'reviewed_by' => $this->manager->id,
            'review_notes' => 'Approved for vacation',
        ]);
    }

    public function test_manager_can_reject_leave_request()
    {
        Sanctum::actingAs($this->manager);

        $leaveRequest = LeaveRequest::factory()->create([
            'status' => 'pending',
        ]);

        $response = $this->putJson("/api/v1/workforce/leave-requests/{$leaveRequest->id}", [
            'status' => 'rejected',
            'review_notes' => 'Insufficient coverage',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('leave_requests', [
            'id' => $leaveRequest->id,
            'status' => 'rejected',
            'review_notes' => 'Insufficient coverage',
        ]);
    }

    public function test_employee_cannot_approve_leave_request()
    {
        Sanctum::actingAs($this->employee);

        $leaveRequest = LeaveRequest::factory()->create([
            'employee_id' => $this->employeeRecord->id,
            'status' => 'pending',
        ]);

        $response = $this->putJson("/api/v1/workforce/leave-requests/{$leaveRequest->id}", [
            'status' => 'approved',
        ]);

        $response->assertStatus(403);
    }

    public function test_cannot_review_already_reviewed_leave_request()
    {
        Sanctum::actingAs($this->manager);

        $leaveRequest = LeaveRequest::factory()->create([
            'status' => 'approved',
            'reviewed_by' => $this->manager->id,
            'reviewed_at' => now(),
        ]);

        $response = $this->putJson("/api/v1/workforce/leave-requests/{$leaveRequest->id}", [
            'status' => 'rejected',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Leave request has already been reviewed',
            ]);
    }

    public function test_employee_can_delete_pending_leave_request()
    {
        Sanctum::actingAs($this->employee);

        $leaveRequest = LeaveRequest::factory()->create([
            'employee_id' => $this->employeeRecord->id,
            'status' => 'pending',
        ]);

        $response = $this->deleteJson("/api/v1/workforce/leave-requests/{$leaveRequest->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Leave request deleted successfully',
            ]);

        $this->assertDatabaseMissing('leave_requests', [
            'id' => $leaveRequest->id,
        ]);
    }

    public function test_cannot_delete_approved_leave_request()
    {
        Sanctum::actingAs($this->employee);

        $leaveRequest = LeaveRequest::factory()->create([
            'employee_id' => $this->employeeRecord->id,
            'status' => 'approved',
        ]);

        $response = $this->deleteJson("/api/v1/workforce/leave-requests/{$leaveRequest->id}");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Only pending leave requests can be deleted',
            ]);
    }

    public function test_employee_can_view_own_leave_request()
    {
        Sanctum::actingAs($this->employee);

        $leaveRequest = LeaveRequest::factory()->create([
            'employee_id' => $this->employeeRecord->id,
        ]);

        $response = $this->getJson("/api/v1/workforce/leave-requests/{$leaveRequest->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $leaveRequest->id,
                ],
            ]);
    }

    public function test_employee_cannot_view_other_leave_request()
    {
        Sanctum::actingAs($this->employee);

        $leaveRequest = LeaveRequest::factory()->create();

        $response = $this->getJson("/api/v1/workforce/leave-requests/{$leaveRequest->id}");

        $response->assertStatus(403);
    }

    public function test_unauthenticated_cannot_access_leave_requests()
    {
        $response = $this->getJson('/api/v1/workforce/leave-requests');

        $response->assertStatus(401);
    }
}
