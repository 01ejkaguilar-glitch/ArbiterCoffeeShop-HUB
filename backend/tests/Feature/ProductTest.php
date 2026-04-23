<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Tests\TestHelpers;

class ProductTest extends TestCase
{
    use RefreshDatabase, TestHelpers;

    /**
     * Setup the test environment
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->setupRolesAndPermissions();
        
        // Workaround for PHP 8.4 transaction issue
        // Ensure no active transactions before starting test
        try {
            DB::connection()->getPdo()->exec('COMMIT');
        } catch (\Exception $e) {
            // Ignore if no active transaction
        }
    }

    /**
     * Test guest can view products
     */
    public function test_guest_can_view_products(): void
    {
        $category = Category::factory()->create();
        Product::factory()->count(5)->create([
            'category_id' => $category->id,
            'is_available' => true,
        ]);

        $response = $this->getJson('/api/v1/products');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => ['id', 'name', 'price', 'category'],
                    ],
                ],
            ]);
    }

    /**
     * Test admin can create product
     */
    public function test_admin_can_create_product(): void
    {
        $user = User::factory()->create();
        $user->assignRole('admin');
        
        $category = Category::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/products', [
                'name' => 'Cappuccino',
                'description' => 'Classic Italian coffee',
                'price' => 120.00,
                'category_id' => $category->id,
                'stock_quantity' => 100,
                'is_available' => true,
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('products', [
            'name' => 'Cappuccino',
            'price' => 120.00,
        ]);
    }

    /**
     * Test customer cannot create product
     */
    public function test_customer_cannot_create_product(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');
        
        $category = Category::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/products', [
                'name' => 'Latte',
                'price' => 130.00,
                'category_id' => $category->id,
            ]);

        $response->assertStatus(403);
    }
}
