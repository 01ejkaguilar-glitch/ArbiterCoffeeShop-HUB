<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\TestHelpers;

class AdminTest extends TestCase
{
    use RefreshDatabase, TestHelpers;

    /**
     * Setup the test environment
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->setupRolesAndPermissions();
    }

    /**
     * Test admin can view all users
     */
    public function test_admin_can_view_all_users(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        
        User::factory()->count(10)->create();

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/users');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => ['id', 'name', 'email'],
                    ],
                ],
            ]);
    }

    /**
     * Test admin can create user
     */
    public function test_admin_can_create_user(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)
            ->postJson('/api/v1/admin/users', [
                'name' => 'New User',
                'email' => 'newuser@example.com',
                'password' => 'password123',
                'role' => 'customer',
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('users', [
            'email' => 'newuser@example.com',
        ]);
    }

    /**
     * Test admin can get user statistics
     */
    public function test_admin_can_get_user_statistics(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/users/statistics');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_users',
                    'active_users',
                    'by_role',
                ],
            ]);
    }

    /**
     * Test customer cannot access admin endpoints
     */
    public function test_customer_cannot_access_admin_endpoints(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $response = $this->actingAs($customer)
            ->getJson('/api/v1/admin/users');

        $response->assertStatus(403);
    }

    /**
     * Test admin can view sales analytics
     */
    public function test_admin_can_view_sales_analytics(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/analytics/sales');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'summary',
                    'daily_sales',
                ],
            ]);
    }
}
