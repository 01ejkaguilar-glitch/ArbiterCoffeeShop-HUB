<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Product;
use App\Models\Category;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\TestHelpers;

class OrderTest extends TestCase
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
     * Test creating an order
     */
    public function test_customer_can_create_order(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $category = Category::factory()->create();
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'price' => 150.00,
            'is_available' => true,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/orders', [
                'order_type' => 'dine-in',
                'payment_method' => 'cash',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'quantity' => 2,
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'order_number',
                    'status',
                    'total_amount',
                ],
            ]);

        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'status' => 'pending',
            'total_amount' => 300.00,
        ]);
    }

    /**
     * Test customer can view their orders
     */
    public function test_customer_can_view_orders(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        Order::factory()->count(3)->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->getJson('/api/v1/orders');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data.data');
    }

    /**
     * Test creating order with unavailable product fails
     */
    public function test_cannot_order_unavailable_product(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $category = Category::factory()->create();
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'is_available' => false,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/orders', [
                'order_type' => 'dine-in',
                'payment_method' => 'cash',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'quantity' => 1,
                    ],
                ],
            ]);

        $response->assertStatus(400);
    }
}
