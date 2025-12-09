<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SystemConfig;
use Illuminate\Http\JsonResponse;

class PublicController extends Controller
{
    /**
     * Get operating hours (admin-customizable)
     * GET /api/v1/settings/operating-hours
     */
    public function getOperatingHours(): JsonResponse
    {
        $operatingHours = SystemConfig::getValue('operating_hours', [
            'monday' => ['open' => '00:00', 'close' => '00:00', 'is_open' => false],
            'tuesday' => ['open' => '09:00', 'close' => '21:00', 'is_open' => true],
            'wednesday' => ['open' => '09:00', 'close' => '21:00', 'is_open' => true],
            'thursday' => ['open' => '09:00', 'close' => '21:00', 'is_open' => true],
            'friday' => ['open' => '09:00', 'close' => '21:00', 'is_open' => true],
            'saturday' => ['open' => '09:00', 'close' => '21:00', 'is_open' => true],
            'sunday' => ['open' => '09:00', 'close' => '21:00', 'is_open' => true],
        ]);

        return $this->sendResponse($operatingHours, 'Operating hours retrieved successfully');
    }

    /**
     * Get contact information (admin-customizable)
     * GET /api/v1/settings/contact-info
     */
    public function getContactInfo(): JsonResponse
    {
        $contactInfo = SystemConfig::getValue('contact_info', [
            'phone' => '0977 278 8903',
            'email' => 'arbitercoffee.ph@gmail.com',
            'address' => [
                'street' => 'Behind House, 146 Bagong Bayan 2',
                'city' => 'Bongabong',
                'province' => 'Oriental Mindoro',
                'postal_code' => '5211',
                'country' => 'Philippines',
            ],
            'social_media' => [
                'facebook' => 'https://www.facebook.com/profile.php?id=100085413528378',
                'instagram' => 'https://instagram.com/arbitercoffee.ph',
                'twitter' => 'https://twitter.com/arbitercoffee',
                'tiktok' => 'https://tiktok.com/@arbitercoffee.ph',
            ],
            'map_coordinates' => [
                'latitude' => 12.751724280270828,
                'longitude' => 121.48253475276138,
            ],
        ]);

        return $this->sendResponse($contactInfo, 'Contact information retrieved successfully');
    }

    /**
     * Get team members list (admin-customizable)
     * GET /api/v1/team-members
     */
    public function getTeamMembers(): JsonResponse
    {
        $teamMembers = SystemConfig::getValue('team_members', [
            [
                'id' => 1,
                'name' => 'Juan Dela Cruz',
                'position' => 'Head Barista',
                'bio' => 'Passionate coffee enthusiast with 10+ years of experience in specialty coffee.',
                'photo_url' => '/images/team/juan.jpg',
                'specialties' => ['Espresso', 'Latte Art', 'Coffee Tasting'],
                'order' => 1,
            ],
            [
                'id' => 2,
                'name' => 'Maria Santos',
                'position' => 'Coffee Roaster',
                'bio' => 'Expert in coffee roasting with a focus on single-origin beans.',
                'photo_url' => '/images/team/maria.jpg',
                'specialties' => ['Coffee Roasting', 'Bean Selection', 'Quality Control'],
                'order' => 2,
            ],
            [
                'id' => 3,
                'name' => 'Carlos Reyes',
                'position' => 'Customer Experience Manager',
                'bio' => 'Dedicated to creating memorable coffee experiences for every customer.',
                'photo_url' => '/images/team/carlos.jpg',
                'specialties' => ['Customer Service', 'Coffee Education', 'Event Management'],
                'order' => 3,
            ],
        ]);

        // Sort by order
        usort($teamMembers, function ($a, $b) {
            return ($a['order'] ?? 999) <=> ($b['order'] ?? 999);
        });

        return $this->sendResponse($teamMembers, 'Team members retrieved successfully');
    }

    /**
     * Get company timeline/milestones (admin-customizable)
     * GET /api/v1/company-timeline
     */
    public function getCompanyTimeline(): JsonResponse
    {
        $timeline = SystemConfig::getValue('company_timeline', [
            [
                'id' => 1,
                'year' => 2018,
                'title' => 'The Beginning',
                'description' => 'Arbiter Coffee Hub was founded with a vision to bring specialty coffee to the Philippines.',
                'image_url' => '/images/timeline/2018.jpg',
                'order' => 1,
            ],
            [
                'id' => 2,
                'year' => 2019,
                'title' => 'First Expansion',
                'description' => 'Opened our second location and started our coffee roasting operations.',
                'image_url' => '/images/timeline/2019.jpg',
                'order' => 2,
            ],
            [
                'id' => 3,
                'year' => 2020,
                'title' => 'Innovation in Crisis',
                'description' => 'Launched online ordering and contactless delivery during the pandemic.',
                'image_url' => '/images/timeline/2020.jpg',
                'order' => 3,
            ],
            [
                'id' => 4,
                'year' => 2022,
                'title' => 'Coffee Education',
                'description' => 'Started our barista training program to share coffee knowledge with the community.',
                'image_url' => '/images/timeline/2022.jpg',
                'order' => 4,
            ],
            [
                'id' => 5,
                'year' => 2024,
                'title' => 'Going Digital',
                'description' => 'Launched our comprehensive digital platform with AI-powered personalization.',
                'image_url' => '/images/timeline/2024.jpg',
                'order' => 5,
            ],
            [
                'id' => 6,
                'year' => 2025,
                'title' => 'Nationwide Presence',
                'description' => 'Expanded to 10 locations across Metro Manila and major cities.',
                'image_url' => '/images/timeline/2025.jpg',
                'order' => 6,
            ],
        ]);

        // Sort by order (chronological)
        usort($timeline, function ($a, $b) {
            return ($a['order'] ?? 999) <=> ($b['order'] ?? 999);
        });

        return $this->sendResponse($timeline, 'Company timeline retrieved successfully');
    }

    /**
     * Send success response
     */
    private function sendResponse($data, string $message): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message,
        ], 200);
    }
}
