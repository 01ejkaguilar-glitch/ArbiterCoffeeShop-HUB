<?php

namespace Tests\Performance;

use App\Models\User;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\TestHelpers;

class LoadTest extends TestCase
{
    use RefreshDatabase, TestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setupRolesAndPermissions();
    }

    /**
     * Test concurrent user authentication
     */
    public function test_concurrent_login_performance()
    {
        $users = User::factory()->count(100)->create([
            'password' => bcrypt('Password123'),
        ]);

        $startTime = microtime(true);
        $responses = [];

        foreach ($users->take(50) as $user) {
            $response = $this->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'Password123',
            ]);

            $responses[] = [
                'status' => $response->status(),
                'time' => microtime(true) - $startTime,
            ];
        }

        $endTime = microtime(true);
        $totalTime = $endTime - $startTime;
        $avgTime = $totalTime / 50;

        $this->assertLessThan(10, $totalTime, 'Total login time should be under 10 seconds for 50 users');
        $this->assertLessThan(0.2, $avgTime, 'Average login time should be under 200ms');

        // Log performance metrics
        $this->logPerformanceMetrics('Concurrent Login Test', [
            'total_requests' => 50,
            'total_time' => round($totalTime, 3),
            'avg_time' => round($avgTime, 3),
            'requests_per_second' => round(50 / $totalTime, 2),
        ]);
    }

    /**
     * Test product listing performance with pagination
     */
    public function test_product_listing_performance()
    {
        $category = Category::factory()->create();
        Product::factory()->count(1000)->create([
            'category_id' => $category->id,
        ]);

        $startTime = microtime(true);

        // Test paginated requests
        $responses = [];
        for ($page = 1; $page <= 10; $page++) {
            $response = $this->getJson("/api/v1/products?page={$page}&per_page=15");
            $responses[] = [
                'page' => $page,
                'status' => $response->status(),
                'time' => microtime(true) - $startTime,
            ];

            $response->assertStatus(200);
        }

        $endTime = microtime(true);
        $totalTime = $endTime - $startTime;
        $avgTime = $totalTime / 10;

        $this->assertLessThan(2, $totalTime, 'Total pagination time should be under 2 seconds');
        $this->assertLessThan(0.2, $avgTime, 'Average page load time should be under 200ms');

        $this->logPerformanceMetrics('Product Listing Performance', [
            'total_products' => 1000,
            'pages_tested' => 10,
            'total_time' => round($totalTime, 3),
            'avg_time_per_page' => round($avgTime, 3),
        ]);
    }

    /**
     * Test order creation performance under load
     */
    public function test_order_creation_performance()
    {
        $user = User::factory()->create();
        $user->assignRole('customer');
        
        $products = Product::factory()->count(10)->create([
            'stock_quantity' => 1000,
        ]);

        $token = $user->createToken('test-token', ['*'], now()->addDays(7))->plainTextToken;

        $startTime = microtime(true);
        $successfulOrders = 0;

        // Create 20 orders
        for ($i = 0; $i < 20; $i++) {
            $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                ->postJson('/api/v1/orders', [
                    'order_type' => 'take-out',
                    'payment_method' => 'cash',
                    'items' => [
                        [
                            'product_id' => $products->random()->id,
                            'quantity' => rand(1, 3),
                            'customizations' => ['size' => 'medium'],
                        ],
                    ],
                ]);

            if ($response->status() === 201) {
                $successfulOrders++;
            }
        }

        $endTime = microtime(true);
        $totalTime = $endTime - $startTime;
        $avgTime = $totalTime / 20;

        $this->assertEquals(20, $successfulOrders, 'All orders should be created successfully');
        $this->assertLessThan(5, $totalTime, 'Total order creation time should be under 5 seconds');
        $this->assertLessThan(0.25, $avgTime, 'Average order creation time should be under 250ms');

        $this->logPerformanceMetrics('Order Creation Performance', [
            'total_orders' => 20,
            'successful_orders' => $successfulOrders,
            'total_time' => round($totalTime, 3),
            'avg_time' => round($avgTime, 3),
            'orders_per_second' => round(20 / $totalTime, 2),
        ]);
    }

    /**
     * Test database query performance with complex joins
     */
    public function test_complex_query_performance()
    {
        $users = User::factory()->count(50)->create();
        $category = Category::factory()->create();
        $products = Product::factory()->count(100)->create([
            'category_id' => $category->id,
        ]);

        // Create orders with items
        foreach ($users->take(30) as $user) {
            $user->assignRole('customer');
            $order = $user->orders()->create([
                'order_number' => 'ORD-' . time() . rand(1000, 9999),
                'status' => 'completed',
                'order_type' => 'dine-in',
                'subtotal' => 100.00,
                'delivery_fee' => 0,
                'total_amount' => 100.00,
                'payment_method' => 'cash',
                'payment_status' => 'paid',
            ]);

            $order->orderItems()->create([
                'product_id' => $products->random()->id,
                'quantity' => 2,
                'unit_price' => 50.00,
                'customizations' => [],
            ]);
        }

        $startTime = microtime(true);

        // Test sales analytics query (complex aggregation)
        $user = User::factory()->create();
        $user->assignRole('admin');
        $token = $user->createToken('test-token', ['*'], now()->addDays(7))->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/admin/analytics/sales');

        $endTime = microtime(true);
        $queryTime = $endTime - $startTime;

        $response->assertStatus(200);
        $this->assertLessThan(0.5, $queryTime, 'Complex analytics query should complete in under 500ms');

        $this->logPerformanceMetrics('Complex Query Performance', [
            'query_type' => 'sales_analytics',
            'total_users' => 50,
            'total_orders' => 30,
            'query_time' => round($queryTime, 3),
        ]);
    }

    /**
     * Test API response time for various endpoints
     */
    public function test_api_endpoint_response_times()
    {
        Category::factory()->count(10)->create();
        Product::factory()->count(50)->create();
        $user = User::factory()->create();
        $user->assignRole('customer');

        $endpoints = [
            ['method' => 'GET', 'url' => '/api/v1/products', 'auth' => false],
            ['method' => 'GET', 'url' => '/api/v1/categories', 'auth' => false],
            ['method' => 'GET', 'url' => '/api/v1/announcements', 'auth' => false],
        ];

        $metrics = [];

        foreach ($endpoints as $endpoint) {
            $startTime = microtime(true);
            
            $response = $this->getJson($endpoint['url']);
            
            $endTime = microtime(true);
            $responseTime = $endTime - $startTime;

            $response->assertStatus(200);
            $this->assertLessThan(0.2, $responseTime, "{$endpoint['url']} should respond in under 200ms");

            $metrics[] = [
                'endpoint' => $endpoint['url'],
                'response_time' => round($responseTime * 1000, 2) . 'ms',
            ];
        }

        $this->logPerformanceMetrics('API Response Times', $metrics);
    }

    /**
     * Helper method to log performance metrics
     */
    protected function logPerformanceMetrics(string $testName, array $metrics)
    {
        $logFile = storage_path('logs/performance-tests.log');
        $timestamp = now()->toDateTimeString();
        
        $logEntry = sprintf(
            "\n[%s] %s\n%s\n",
            $timestamp,
            $testName,
            json_encode($metrics, JSON_PRETTY_PRINT)
        );

        file_put_contents($logFile, $logEntry, FILE_APPEND);
    }
}
