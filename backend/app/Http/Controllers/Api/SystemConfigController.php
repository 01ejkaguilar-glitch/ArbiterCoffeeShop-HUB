<?php

namespace App\Http\Controllers\Api;

use App\Models\SystemConfig;
use Illuminate\Http\Request;

class SystemConfigController extends BaseController
{
    /**
     * Get all system configurations
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $configs = SystemConfig::all();

            return $this->sendResponse($configs, 'System configurations retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve configurations', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get specific configuration by key
     *
     * @param string $key
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($key)
    {
        try {
            $config = SystemConfig::where('key', $key)->firstOrFail();

            return $this->sendResponse($config, 'Configuration retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Configuration not found', 404);
        }
    }

    /**
     * Update or create configuration
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request)
    {
        try {
            $request->validate([
                'key' => 'required|string|max:255',
                'value' => 'required',
                'type' => 'sometimes|in:json,string,number,boolean',
                'description' => 'sometimes|string',
            ]);

            $config = SystemConfig::setValue(
                $request->input('key'),
                $request->input('value'),
                $request->get('type', 'json'),
                $request->get('description', '')
            );

            return $this->sendResponse($config, 'Configuration updated successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to update configuration', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Delete configuration
     *
     * @param string $key
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($key)
    {
        try {
            $config = SystemConfig::where('key', $key)->firstOrFail();
            $config->delete();

            return $this->sendResponse(null, 'Configuration deleted successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to delete configuration', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get operating hours
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getOperatingHours()
    {
        try {
            $hours = SystemConfig::getValue('operating_hours', [
                'monday' => ['open' => '08:00', 'close' => '20:00'],
                'tuesday' => ['open' => '08:00', 'close' => '20:00'],
                'wednesday' => ['open' => '08:00', 'close' => '20:00'],
                'thursday' => ['open' => '08:00', 'close' => '20:00'],
                'friday' => ['open' => '08:00', 'close' => '22:00'],
                'saturday' => ['open' => '09:00', 'close' => '22:00'],
                'sunday' => ['open' => '09:00', 'close' => '20:00'],
            ]);

            return $this->sendResponse($hours, 'Operating hours retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve operating hours', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get contact information
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getContactInfo()
    {
        try {
            $contactInfo = SystemConfig::getValue('contact_info', [
                'phone' => '+63 123 456 7890',
                'email' => 'info@arbitercoffee.com',
                'address' => 'Arbiter Coffee Hub, Main Street, City',
                'social_media' => [
                    'facebook' => 'https://facebook.com/arbitercoffee',
                    'instagram' => 'https://instagram.com/arbitercoffee',
                    'twitter' => 'https://twitter.com/arbitercoffee',
                ],
            ]);

            return $this->sendResponse($contactInfo, 'Contact information retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve contact information', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get team members
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTeamMembers()
    {
        try {
            $team = SystemConfig::getValue('team_members', [
                [
                    'name' => 'John Doe',
                    'position' => 'Master Barista',
                    'bio' => 'With 10 years of experience...',
                    'image' => '/images/team/john.jpg',
                ],
            ]);

            return $this->sendResponse($team, 'Team members retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve team members', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get company timeline
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCompanyTimeline()
    {
        try {
            $timeline = SystemConfig::getValue('company_timeline', [
                [
                    'year' => '2020',
                    'title' => 'Founded',
                    'description' => 'Arbiter Coffee Hub was established...',
                ],
            ]);

            return $this->sendResponse($timeline, 'Company timeline retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve company timeline', 500, ['error' => $e->getMessage()]);
        }
    }
}
