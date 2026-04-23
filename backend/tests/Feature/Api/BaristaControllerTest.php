<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BaristaControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $barista;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'barista']);

        // Create a barista user
        $this->barista = User::factory()->create();
        $this->barista->assignRole('barista');

        Sanctum::actingAs($this->barista);
    }

    public function test_barista_can_get_performance_metrics()
    {
        // Create some test orders assigned to the barista
        Order::factory()->count(3)->create([
            'barista_id' => $this->barista->id,
            'status' => 'completed',
            'prepared_at' => now(),
        ]);

        Order::factory()->count(2)->create([
            'barista_id' => $this->barista->id,
            'status' => 'pending',
        ]);

        $response = $this->getJson('/api/v1/barista/performance?period=today');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'orders_completed',
                    'total_orders',
                    'avg_preparation_time',
                    'customer_ratings',
                    'period',
                ],
                'message'
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'orders_completed' => 3,
                    'total_orders' => 5,
                    'period' => 'today',
                ]
            ]);
    }
}