<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Employee;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EmployeeControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $manager;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'workforce-manager']);
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'barista']);

        // Create a manager user
        $this->manager = User::factory()->create();
        $this->manager->assignRole('workforce-manager');

        // Create a regular employee user
        $this->user = User::factory()->create();
        $this->user->assignRole('barista');

        Sanctum::actingAs($this->manager);
    }

    public function test_manager_can_list_employees()
    {
        Employee::factory()->count(3)->create();

        $response = $this->getJson('/api/v1/workforce/employees');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => [
                            'id',
                            'user_id',
                            'employee_number',
                            'position',
                            'department',
                            'hire_date',
                            'salary'
                        ]
                    ],
                    'current_page',
                    'per_page',
                    'total'
                ]
            ]);
    }

    public function test_manager_can_create_employee()
    {
        $employeeData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '1234567890',
            'password' => 'password123',
            'position' => 'Barista',
            'department' => 'Operations',
            'hire_date' => '2024-01-01',
            'salary' => 25000.00,
            'emergency_contact_name' => 'Jane Doe',
            'emergency_contact_phone' => '0987654321',
            'role' => 'barista'
        ];

        $response = $this->postJson('/api/v1/workforce/employees', $employeeData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'user_id',
                    'employee_number',
                    'position',
                    'department',
                    'hire_date',
                    'salary'
                ]
            ]);

        $this->assertDatabaseHas('employees', [
            'position' => 'Barista',
            'department' => 'Operations',
            'hire_date' => '2024-01-01',
            'salary' => 25000.00,
        ]);
        $this->assertDatabaseHas('users', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);
    }

    public function test_manager_can_view_employee()
    {
        $employee = Employee::factory()->create();

        $response = $this->getJson("/api/v1/workforce/employees/{$employee->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'user_id',
                    'employee_number',
                    'position',
                    'department',
                    'hire_date',
                    'salary'
                ]
            ]);
    }

    public function test_manager_can_update_employee()
    {
        $employee = Employee::factory()->create();

        $updateData = [
            'position' => 'Senior Barista',
            'department' => 'Premium Coffee',
            'salary' => 30000.00,
            'status' => 'active'
        ];

        $response = $this->putJson("/api/v1/workforce/employees/{$employee->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'position' => 'Senior Barista',
                    'department' => 'Premium Coffee',
                    'salary' => 30000.00
                ]
            ]);

        $this->assertDatabaseHas('employees', array_merge(['id' => $employee->id], $updateData));
    }

    public function test_manager_can_delete_employee()
    {
        $employee = Employee::factory()->create();

        $response = $this->deleteJson("/api/v1/workforce/employees/{$employee->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Employee deleted successfully'
            ]);

        $this->assertDatabaseMissing('employees', ['id' => $employee->id]);
    }

    public function test_employee_creation_validation()
    {
        $response = $this->postJson('/api/v1/workforce/employees', [
            // Missing required fields
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password', 'position', 'hire_date', 'role']);
    }

    public function test_employee_statistics_are_returned()
    {
        Employee::factory()->count(5)->create(['status' => 'active']);
        Employee::factory()->count(2)->create(['status' => 'terminated']);

        $response = $this->getJson('/api/v1/workforce/employees/statistics');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_employees',
                    'active_employees',
                    'on_leave'
                ]
            ]);

        $stats = $response->json('data');
        $this->assertEquals(7, $stats['total_employees']);
        $this->assertEquals(5, $stats['active_employees']);
        $this->assertEquals(0, $stats['on_leave']); // No employees on leave in this test
    }

    public function test_regular_employee_cannot_access_employee_management()
    {
        Sanctum::actingAs($this->user); // Switch to regular employee

        $response = $this->getJson('/api/v1/workforce/employees');

        $response->assertStatus(403);
    }
}
