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
                'year' => 2023,
                'title' => 'The Beginning',
                'description' => 'Arbiter Coffee Hub opened its doors in April 2023 with a vision to bring specialty coffee to the Philippines.',
                'image_url' => '/images/timeline/2023.jpg',
                'order' => 1,
            ],
            [
                'id' => 2,
                'year' => 2023,
                'title' => 'Building the Menu',
                'description' => 'Curated our signature drinks and food offerings, sourcing quality beans from local and international roasters.',
                'image_url' => '/images/timeline/2023b.jpg',
                'order' => 2,
            ],
            [
                'id' => 3,
                'year' => 2024,
                'title' => 'Going Digital',
                'description' => 'Launched our online ordering platform, making it easier for customers to enjoy Arbiter Coffee anywhere.',
                'image_url' => '/images/timeline/2024.jpg',
                'order' => 3,
            ],
            [
                'id' => 4,
                'year' => 2025,
                'title' => 'Growing Community',
                'description' => 'Expanded our team, introduced loyalty rewards, and built a community of coffee lovers around the brand.',
                'image_url' => '/images/timeline/2025.jpg',
                'order' => 4,
            ],
            [
                'id' => 5,
                'year' => 2026,
                'title' => 'What\'s Next',
                'description' => 'Continuing to grow — new products, new experiences, and an even stronger coffee community.',
                'image_url' => '/images/timeline/2026.jpg',
                'order' => 5,
            ],
        ]);

        // Sort by order (chronological)
        usort($timeline, function ($a, $b) {
            return ($a['order'] ?? 999) <=> ($b['order'] ?? 999);
        });

        return $this->sendResponse($timeline, 'Company timeline retrieved successfully');
    }

    /**
     * Update team members (admin only)
     * PUT /api/v1/admin/team-members
     */
    public function updateTeamMembers(\Illuminate\Http\Request $request): JsonResponse
    {
        $validated = $request->validate([
            'team'                      => 'required|array|min:1',
            'team.*.name'               => 'required|string|max:120',
            'team.*.position'           => 'required|string|max:120',
            'team.*.bio'                => 'required|string|max:500',
            'team.*.photo_url'          => 'nullable|string|max:255',
            'team.*.specialties'        => 'nullable|array',
            'team.*.specialties.*'      => 'string|max:80',
            'team.*.order'              => 'nullable|integer',
        ]);

        $items = array_values($validated['team']);
        foreach ($items as $i => &$item) {
            $item['id']        = $i + 1;
            $item['order']     = $item['order'] ?? ($i + 1);
            $item['photo_url'] = $item['photo_url'] ?? '';
            $item['specialties'] = $item['specialties'] ?? [];
        }
        unset($item);

        usort($items, fn ($a, $b) => $a['order'] <=> $b['order']);

        SystemConfig::setValue('team_members', $items, 'json', 'Team members displayed on About page');

        return $this->sendResponse($items, 'Team members updated successfully');
    }

    /**
     * Update company timeline (admin only)
     * PUT /api/v1/admin/company-timeline
     */
    public function updateCompanyTimeline(\Illuminate\Http\Request $request): JsonResponse
    {
        $validated = $request->validate([
            'timeline'                  => 'required|array|min:1',
            'timeline.*.year'           => 'required|integer|min:1900|max:2100',
            'timeline.*.title'          => 'required|string|max:120',
            'timeline.*.description'    => 'required|string|max:500',
            'timeline.*.image_url'      => 'nullable|string|max:255',
            'timeline.*.order'          => 'nullable|integer',
        ]);

        $items = array_values($validated['timeline']);
        foreach ($items as $i => &$item) {
            $item['id']    = $i + 1;
            $item['order'] = $item['order'] ?? ($i + 1);
            $item['image_url'] = $item['image_url'] ?? '';
        }
        unset($item);

        usort($items, fn ($a, $b) => $a['order'] <=> $b['order']);

        SystemConfig::setValue('company_timeline', $items, 'json', 'Company journey milestones');

        return $this->sendResponse($items, 'Timeline updated successfully');
    }

    /* ─── Individual Timeline CRUD ──────────────────────────────── */

    /**
     * Create a single timeline entry (admin only)
     * POST /api/v1/admin/company-timeline
     */
    public function createTimelineEntry(\Illuminate\Http\Request $request): JsonResponse
    {
        $validated = $request->validate([
            'year'        => 'required|integer|min:1900|max:2100',
            'title'       => 'required|string|max:120',
            'description' => 'required|string|max:500',
            'image_url'   => 'nullable|string|max:255',
            'order'       => 'nullable|integer',
        ]);

        $timeline = SystemConfig::getValue('company_timeline', []);
        $maxId = collect($timeline)->max('id') ?? 0;
        $validated['id']        = (int)$maxId + 1;
        $validated['order']     = $validated['order'] ?? (count($timeline) + 1);
        $validated['image_url'] = $validated['image_url'] ?? '';
        $timeline[] = $validated;

        usort($timeline, fn ($a, $b) => ($a['order'] ?? 999) <=> ($b['order'] ?? 999));
        SystemConfig::setValue('company_timeline', $timeline, 'json', 'Company journey milestones');

        return $this->sendResponse($validated, 'Timeline entry created successfully');
    }

    /**
     * Update a single timeline entry by id (admin only)
     * PUT /api/v1/admin/company-timeline/{id}
     */
    public function updateTimelineEntry(\Illuminate\Http\Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'year'        => 'required|integer|min:1900|max:2100',
            'title'       => 'required|string|max:120',
            'description' => 'required|string|max:500',
            'image_url'   => 'nullable|string|max:255',
            'order'       => 'nullable|integer',
        ]);

        $timeline = SystemConfig::getValue('company_timeline', []);
        $found = false;
        foreach ($timeline as &$entry) {
            if ((int)($entry['id'] ?? 0) === (int)$id) {
                $entry     = array_merge($entry, $validated);
                $entry['id'] = (int)$id;
                $found     = true;
                break;
            }
        }
        unset($entry);

        if (!$found) {
            return response()->json(['success' => false, 'message' => 'Timeline entry not found'], 404);
        }

        usort($timeline, fn ($a, $b) => ($a['order'] ?? 999) <=> ($b['order'] ?? 999));
        SystemConfig::setValue('company_timeline', $timeline, 'json', 'Company journey milestones');

        return $this->sendResponse($validated, 'Timeline entry updated successfully');
    }

    /**
     * Delete a single timeline entry by id (admin only)
     * DELETE /api/v1/admin/company-timeline/{id}
     */
    public function deleteTimelineEntry($id): JsonResponse
    {
        $timeline = SystemConfig::getValue('company_timeline', []);
        $filtered = array_values(array_filter($timeline, fn ($e) => (int)($e['id'] ?? 0) !== (int)$id));

        if (count($filtered) === count($timeline)) {
            return response()->json(['success' => false, 'message' => 'Timeline entry not found'], 404);
        }

        SystemConfig::setValue('company_timeline', $filtered, 'json', 'Company journey milestones');

        return $this->sendResponse(null, 'Timeline entry deleted successfully');
    }

    /* ─── Individual Team-Member CRUD ───────────────────────────── */

    /**
     * Create a single team member (admin only)
     * POST /api/v1/admin/team-members
     */
    public function createTeamMember(\Illuminate\Http\Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:120',
            'position'      => 'required|string|max:120',
            'bio'           => 'required|string|max:500',
            'photo_url'     => 'nullable|string|max:255',
            'specialties'   => 'nullable|array',
            'specialties.*' => 'string|max:80',
            'order'         => 'nullable|integer',
        ]);

        $team  = SystemConfig::getValue('team_members', []);
        $maxId = collect($team)->max('id') ?? 0;
        $validated['id']          = (int)$maxId + 1;
        $validated['order']       = $validated['order'] ?? (count($team) + 1);
        $validated['photo_url']   = $validated['photo_url'] ?? '';
        $validated['specialties'] = $validated['specialties'] ?? [];
        $team[] = $validated;

        usort($team, fn ($a, $b) => ($a['order'] ?? 999) <=> ($b['order'] ?? 999));
        SystemConfig::setValue('team_members', $team, 'json', 'Team members displayed on About page');

        return $this->sendResponse($validated, 'Team member created successfully');
    }

    /**
     * Update a single team member by id (admin only)
     * PUT /api/v1/admin/team-members/{id}
     */
    public function updateTeamMember(\Illuminate\Http\Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:120',
            'position'      => 'required|string|max:120',
            'bio'           => 'required|string|max:500',
            'photo_url'     => 'nullable|string|max:255',
            'specialties'   => 'nullable|array',
            'specialties.*' => 'string|max:80',
            'order'         => 'nullable|integer',
        ]);

        $team  = SystemConfig::getValue('team_members', []);
        $found = false;
        foreach ($team as &$member) {
            if ((int)($member['id'] ?? 0) === (int)$id) {
                $member       = array_merge($member, $validated);
                $member['id'] = (int)$id;
                $found        = true;
                break;
            }
        }
        unset($member);

        if (!$found) {
            return response()->json(['success' => false, 'message' => 'Team member not found'], 404);
        }

        usort($team, fn ($a, $b) => ($a['order'] ?? 999) <=> ($b['order'] ?? 999));
        SystemConfig::setValue('team_members', $team, 'json', 'Team members displayed on About page');

        return $this->sendResponse($validated, 'Team member updated successfully');
    }

    /**
     * Delete a single team member by id (admin only)
     * DELETE /api/v1/admin/team-members/{id}
     */
    public function deleteTeamMember($id): JsonResponse
    {
        $team     = SystemConfig::getValue('team_members', []);
        $filtered = array_values(array_filter($team, fn ($m) => (int)($m['id'] ?? 0) !== (int)$id));

        if (count($filtered) === count($team)) {
            return response()->json(['success' => false, 'message' => 'Team member not found'], 404);
        }

        SystemConfig::setValue('team_members', $filtered, 'json', 'Team members displayed on About page');

        return $this->sendResponse(null, 'Team member deleted successfully');
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
