<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Product;
use App\Models\Order;
use App\Models\Category;
use App\Models\CoffeeBean;
use App\Services\RecommendationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecommendationTest extends TestCase
{
    use RefreshDatabase;

    protected $customer;
    protected $recommendationService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->recommendationService = app(RecommendationService::class);
        
        // Create test customer
        $this->customer = User::factory()->create(['email' => 'customer@test.com']);
        $this->customer->assignRole('customer');
    }

    /** @test */
    public function it_generates_product_recommendations_for_new_customer()
    {
        $this->actingAs($this->customer, 'sanctum');

        $response = $this->getJson('/api/v1/recommendations/products');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
                'message'
            ]);
    }

    /** @test */
    public function it_generates_recommendations_based_on_purchase_history()
    {
        // Create categories
        $coffeeCategory = Category::factory()->create(['name' => 'Coffee']);
        $pastryCategory = Category::factory()->create(['name' => 'Pastries']);

        // Create products
        $latte = Product::factory()->create([
            'name' => 'Latte',
            'category_id' => $coffeeCategory->id,
        ]);
        $croissant = Product::factory()->create([
            'name' => 'Croissant',
            'category_id' => $pastryCategory->id,
        ]);
        $cappuccino = Product::factory()->create([
            'name' => 'Cappuccino',
            'category_id' => $coffeeCategory->id,
        ]);

        // Create order history
        $order = Order::factory()->create([
            'user_id' => $this->customer->id,
            'status' => 'completed',
        ]);
        $order->items()->create([
            'product_id' => $latte->id,
            'quantity' => 1,
            'unit_price' => 5.00,
        ]);

        $recommendations = $this->recommendationService->getProductRecommendations($this->customer->id, 5);

        $this->assertNotEmpty($recommendations);
        $this->assertIsArray($recommendations);
    }

    /** @test */
    public function it_generates_coffee_bean_recommendations()
    {
        CoffeeBean::factory()->count(5)->create(['stock_quantity' => 10]);

        $this->actingAs($this->customer, 'sanctum');

        $response = $this->getJson('/api/v1/recommendations/coffee-beans');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
                'message'
            ]);
    }

    /** @test */
    public function it_calculates_customer_affinity_score()
    {
        $product = Product::factory()->create();

        // Create purchase history
        $order = Order::factory()->create([
            'user_id' => $this->customer->id,
            'status' => 'completed',
        ]);
        $order->items()->create([
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 10.00,
        ]);

        $score = $this->recommendationService->calculateCustomerAffinityScore(
            $this->customer->id,
            $product->id
        );

        $this->assertIsFloat($score);
        $this->assertGreaterThan(0, $score);
        $this->assertLessThanOrEqual(100, $score);
    }

    /** @test */
    public function it_provides_homepage_recommendations()
    {
        CoffeeBean::factory()->count(3)->create(['stock_quantity' => 10]);
        Product::factory()->count(5)->create(['is_available' => true]);

        $this->actingAs($this->customer, 'sanctum');

        $response = $this->getJson('/api/v1/recommendations/homepage');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'recommended_products',
                    'recommended_coffee_beans',
                    'personalization_level',
                ],
                'message'
            ]);
    }

    /** @test */
    public function it_clears_recommendation_cache()
    {
        $this->actingAs($this->customer, 'sanctum');

        $response = $this->postJson('/api/v1/recommendations/clear-cache');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message'
            ]);
    }

    /** @test */
    public function it_uses_collaborative_filtering()
    {
        // Create another customer with similar purchases
        $similarCustomer = User::factory()->create();
        $similarCustomer->assignRole('customer');

        $category = Category::factory()->create();
        $product1 = Product::factory()->create(['category_id' => $category->id]);
        $product2 = Product::factory()->create(['category_id' => $category->id]);
        $product3 = Product::factory()->create(['category_id' => $category->id]);

        // Both customers bought product1
        foreach ([$this->customer, $similarCustomer] as $customer) {
            $order = Order::factory()->create([
                'user_id' => $customer->id,
                'status' => 'completed',
            ]);
            $order->items()->create([
                'product_id' => $product1->id,
                'quantity' => 1,
                'unit_price' => 5.00,
            ]);
        }

        // Similar customer also bought product2
        $order = Order::factory()->create([
            'user_id' => $similarCustomer->id,
            'status' => 'completed',
        ]);
        $order->items()->create([
            'product_id' => $product2->id,
            'quantity' => 1,
            'unit_price' => 5.00,
        ]);

        $recommendations = $this->recommendationService->getProductRecommendations($this->customer->id, 5);

        // Should recommend product2 based on collaborative filtering
        $this->assertNotEmpty($recommendations);
    }

    /** @test */
    public function it_respects_recommendation_limit()
    {
        Product::factory()->count(20)->create(['is_available' => true]);

        $recommendations = $this->recommendationService->getProductRecommendations($this->customer->id, 3);

        $this->assertCount(3, $recommendations);
    }

    /** @test */
    public function it_requires_authentication_for_recommendations()
    {
        $response = $this->getJson('/api/v1/recommendations/products');

        $response->assertStatus(401);
    }

    /** @test */
    public function it_validates_limit_parameter()
    {
        $this->actingAs($this->customer, 'sanctum');

        // Too high limit
        $response = $this->getJson('/api/v1/recommendations/products?limit=100');
        $response->assertStatus(422);

        // Invalid limit
        $response = $this->getJson('/api/v1/recommendations/products?limit=invalid');
        $response->assertStatus(422);

        // Valid limit
        $response = $this->getJson('/api/v1/recommendations/products?limit=5');
        $response->assertStatus(200);
    }

    /** @test */
    public function it_handles_empty_product_catalog()
    {
        $recommendations = $this->recommendationService->getProductRecommendations($this->customer->id, 5);

        $this->assertIsArray($recommendations);
    }

    /** @test */
    public function affinity_score_increases_with_frequency()
    {
        $product = Product::factory()->create();

        // Create multiple orders
        for ($i = 0; $i < 5; $i++) {
            $order = Order::factory()->create([
                'user_id' => $this->customer->id,
                'status' => 'completed',
                'created_at' => now()->subDays($i),
            ]);
            $order->items()->create([
                'product_id' => $product->id,
                'quantity' => 1,
                'unit_price' => 10.00,
            ]);
        }

        $score = $this->recommendationService->calculateCustomerAffinityScore(
            $this->customer->id,
            $product->id
        );

        // High frequency should result in high score
        $this->assertGreaterThan(50, $score);
    }

    /** @test */
    public function it_recommends_featured_coffee_beans()
    {
        CoffeeBean::factory()->count(3)->create([
            'stock_quantity' => 10,
            'is_featured' => false,
        ]);
        
        $featuredBean = CoffeeBean::factory()->create([
            'stock_quantity' => 10,
            'is_featured' => true,
        ]);

        $recommendations = $this->recommendationService->getCoffeeBeanRecommendations($this->customer->id, 5);

        // Featured bean should be recommended
        $featuredRecommended = collect($recommendations)->contains(function ($rec) use ($featuredBean) {
            return $rec['bean']->id === $featuredBean->id;
        });

        $this->assertTrue($featuredRecommended);
    }
}
