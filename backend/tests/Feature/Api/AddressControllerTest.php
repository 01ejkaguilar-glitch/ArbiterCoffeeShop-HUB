<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Address;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AddressControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_user_can_list_their_addresses()
    {
        Address::factory()->count(3)->create(['user_id' => $this->user->id]);

        $response = $this->getJson('/api/v1/customer/addresses');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'user_id',
                        'type',
                        'street',
                        'city',
                        'province',
                        'postal_code',
                        'is_default'
                    ]
                ]
            ])
            ->assertJsonCount(3, 'data');
    }

    public function test_user_can_create_address()
    {
        $addressData = [
            'type' => 'home',
            'street' => '123 Main St',
            'city' => 'Test City',
            'province' => 'Test Province',
            'postal_code' => '12345',
            'is_default' => true
        ];

        $response = $this->postJson('/api/v1/customer/addresses', $addressData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'user_id',
                    'type',
                    'street',
                    'city',
                    'province',
                    'postal_code',
                    'is_default'
                ]
            ]);

        $this->assertDatabaseHas('addresses', array_merge($addressData, ['user_id' => $this->user->id]));
    }

    public function test_user_can_update_their_address()
    {
        $address = Address::factory()->create(['user_id' => $this->user->id]);

        $updateData = [
            'type' => 'work',
            'street' => '456 Office Blvd',
            'city' => 'Updated City',
            'province' => 'Updated Province',
            'postal_code' => '67890',
            'is_default' => false
        ];

        $response = $this->putJson("/api/v1/customer/addresses/{$address->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data'
            ]);

        $this->assertDatabaseHas('addresses', array_merge($updateData, [
            'id' => $address->id,
            'user_id' => $this->user->id
        ]));
    }

    public function test_user_cannot_update_others_address()
    {
        $otherUser = User::factory()->create();
        $address = Address::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->putJson("/api/v1/customer/addresses/{$address->id}", [
            'street_address' => 'Hacked Address'
        ]);

        $response->assertStatus(404);
    }

    public function test_user_can_delete_their_address()
    {
        $address = Address::factory()->create(['user_id' => $this->user->id]);

        $response = $this->deleteJson("/api/v1/customer/addresses/{$address->id}");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('addresses', ['id' => $address->id]);
    }

    public function test_user_cannot_delete_others_address()
    {
        $otherUser = User::factory()->create();
        $address = Address::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->deleteJson("/api/v1/customer/addresses/{$address->id}");

        $response->assertStatus(404);
    }

    public function test_address_validation_works()
    {
        $response = $this->postJson('/api/v1/customer/addresses', [
            // Missing required fields
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type', 'street', 'city', 'province', 'postal_code']);
    }

    public function test_only_one_default_address_per_user()
    {
        // Create first default address
        Address::factory()->create([
            'user_id' => $this->user->id,
            'is_default' => true
        ]);

        // Try to create second default address
        $response = $this->postJson('/api/v1/customer/addresses', [
            'type' => 'work',
            'street' => '456 Office Blvd',
            'city' => 'Work City',
            'province' => 'Work Province',
            'postal_code' => '67890',
            'is_default' => true
        ]);

        $response->assertStatus(201);

        // Check that only one address is default
        $defaultAddresses = Address::where('user_id', $this->user->id)
            ->where('is_default', true)
            ->count();

        $this->assertEquals(1, $defaultAddresses);
    }
}
