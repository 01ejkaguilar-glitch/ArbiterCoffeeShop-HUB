<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\SystemConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PublicApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test getting operating hours with default values
     */
    public function test_get_operating_hours_returns_default_values()
    {
        $response = $this->getJson('/api/v1/settings/operating-hours');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'monday' => ['open', 'close', 'is_open'],
                    'tuesday',
                    'wednesday',
                    'thursday',
                    'friday',
                    'saturday',
                    'sunday',
                ],
                'message',
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'monday' => [
                        'open' => '00:00',
                        'close' => '00:00',
                        'is_open' => false,
                    ],
                ],
            ]);
    }

    /**
     * Test getting operating hours with custom admin values
     */
    public function test_get_operating_hours_returns_custom_values()
    {
        // Set custom operating hours via admin
        SystemConfig::setValue('operating_hours', [
            'monday' => ['open' => '08:00', 'close' => '20:00', 'is_open' => true],
            'tuesday' => ['open' => '08:00', 'close' => '20:00', 'is_open' => true],
            'wednesday' => ['open' => '08:00', 'close' => '20:00', 'is_open' => true],
            'thursday' => ['open' => '08:00', 'close' => '20:00', 'is_open' => true],
            'friday' => ['open' => '08:00', 'close' => '22:00', 'is_open' => true],
            'saturday' => ['open' => '09:00', 'close' => '22:00', 'is_open' => true],
            'sunday' => ['open' => '00:00', 'close' => '00:00', 'is_open' => false],
        ]);

        $response = $this->getJson('/api/v1/settings/operating-hours');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'monday' => [
                        'open' => '08:00',
                        'close' => '20:00',
                        'is_open' => true,
                    ],
                    'sunday' => [
                        'is_open' => false,
                    ],
                ],
            ]);
    }

    /**
     * Test getting contact information with default values
     */
    public function test_get_contact_info_returns_default_values()
    {
        $response = $this->getJson('/api/v1/settings/contact-info');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'phone',
                    'email',
                    'address' => ['street', 'city', 'province', 'postal_code', 'country'],
                    'social_media' => ['facebook', 'instagram', 'twitter'],
                    'map_coordinates' => ['latitude', 'longitude'],
                ],
                'message',
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'email' => 'arbitercoffee.ph@gmail.com',
                ],
            ]);
    }

    /**
     * Test getting contact information with custom admin values
     */
    public function test_get_contact_info_returns_custom_values()
    {
        SystemConfig::setValue('contact_info', [
            'phone' => '+63 912 345 6789',
            'email' => 'custom@arbitercoffee.com',
            'address' => [
                'street' => '456 Custom Street',
                'city' => 'Quezon City',
                'province' => 'Metro Manila',
                'postal_code' => '1100',
                'country' => 'Philippines',
            ],
            'social_media' => [
                'facebook' => 'https://facebook.com/custompage',
                'instagram' => 'https://instagram.com/custompage',
                'twitter' => 'https://twitter.com/custompage',
            ],
            'map_coordinates' => [
                'latitude' => 14.6488,
                'longitude' => 121.0509,
            ],
        ]);

        $response = $this->getJson('/api/v1/settings/contact-info');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'phone' => '+63 912 345 6789',
                    'email' => 'custom@arbitercoffee.com',
                    'address' => [
                        'city' => 'Quezon City',
                    ],
                ],
            ]);
    }

    /**
     * Test getting team members with default values
     */
    public function test_get_team_members_returns_default_values()
    {
        $response = $this->getJson('/api/v1/team-members');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'position',
                        'bio',
                        'photo_url',
                        'specialties',
                        'order',
                    ],
                ],
                'message',
            ])
            ->assertJson([
                'success' => true,
            ]);

        // Check that team members are sorted by order
        $data = $response->json('data');
        $this->assertGreaterThan(0, count($data));
        
        for ($i = 0; $i < count($data) - 1; $i++) {
            $this->assertLessThanOrEqual($data[$i + 1]['order'], $data[$i]['order']);
        }
    }

    /**
     * Test getting team members with custom admin values
     */
    public function test_get_team_members_returns_custom_values()
    {
        SystemConfig::setValue('team_members', [
            [
                'id' => 1,
                'name' => 'Custom Team Member',
                'position' => 'Custom Position',
                'bio' => 'Custom bio text',
                'photo_url' => '/images/custom.jpg',
                'specialties' => ['Specialty 1', 'Specialty 2'],
                'order' => 1,
            ],
        ]);

        $response = $this->getJson('/api/v1/team-members');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    [
                        'name' => 'Custom Team Member',
                        'position' => 'Custom Position',
                    ],
                ],
            ]);
    }

    /**
     * Test getting company timeline with default values
     */
    public function test_get_company_timeline_returns_default_values()
    {
        $response = $this->getJson('/api/v1/company-timeline');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'year',
                        'title',
                        'description',
                        'image_url',
                        'order',
                    ],
                ],
                'message',
            ])
            ->assertJson([
                'success' => true,
            ]);

        // Check that timeline is sorted by order (chronological)
        $data = $response->json('data');
        $this->assertGreaterThan(0, count($data));
        
        for ($i = 0; $i < count($data) - 1; $i++) {
            $this->assertLessThanOrEqual($data[$i + 1]['order'], $data[$i]['order']);
        }
    }

    /**
     * Test getting company timeline with custom admin values
     */
    public function test_get_company_timeline_returns_custom_values()
    {
        SystemConfig::setValue('company_timeline', [
            [
                'id' => 1,
                'year' => 2025,
                'title' => 'Custom Milestone',
                'description' => 'Custom milestone description',
                'image_url' => '/images/custom-timeline.jpg',
                'order' => 1,
            ],
            [
                'id' => 2,
                'year' => 2026,
                'title' => 'Future Goal',
                'description' => 'Future goal description',
                'image_url' => '/images/future.jpg',
                'order' => 2,
            ],
        ]);

        $response = $this->getJson('/api/v1/company-timeline');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    [
                        'year' => 2025,
                        'title' => 'Custom Milestone',
                    ],
                    [
                        'year' => 2026,
                        'title' => 'Future Goal',
                    ],
                ],
            ]);
    }
}
