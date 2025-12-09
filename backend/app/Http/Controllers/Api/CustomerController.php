<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CustomerController extends BaseController
{
    /**
     * Get customer dashboard data
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function dashboard()
    {
        try {
            $user = Auth::user();

            // Get customer statistics
            $totalOrders = Order::where('user_id', $user->id)->count();
            $completedOrders = Order::where('user_id', $user->id)
                ->where('status', 'completed')
                ->count();
            $activeOrders = Order::where('user_id', $user->id)
                ->whereIn('status', ['pending', 'preparing'])
                ->count();
            $totalSpent = Order::where('user_id', $user->id)
                ->where('payment_status', 'paid')
                ->sum('total_amount');

            // Get recent orders
            $recentOrders = Order::where('user_id', $user->id)
                ->with(['orderItems.product'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            // Get active order (if any)
            $activeOrder = Order::where('user_id', $user->id)
                ->whereIn('status', ['pending', 'preparing'])
                ->with(['orderItems.product'])
                ->first();

            $dashboardData = [
                'statistics' => [
                    'total_orders' => $totalOrders,
                    'completed_orders' => $completedOrders,
                    'active_orders' => $activeOrders,
                    'total_spent' => number_format($totalSpent, 2),
                ],
                'recent_orders' => $recentOrders,
                'active_order' => $activeOrder,
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'member_since' => $user->created_at->format('F Y'),
                ],
            ];

            return $this->sendResponse($dashboardData, 'Dashboard data retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve dashboard data', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get customer profile
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getProfile()
    {
        try {
            $user = Auth::user();
            $profile = $user->customerProfile;

            $profileData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $profile->phone ?? null,
                'birthday' => $profile->birthday ?? null,
                'address' => $profile->address ?? null,
                'taste_preferences' => $profile->taste_preferences ?? null,
                'created_at' => $user->created_at,
            ];

            return $this->sendResponse($profileData, 'Profile retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve profile', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Update customer profile
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateProfile(Request $request)
    {
        try {
            $request->validate([
                'name' => 'sometimes|string|max:255',
                'phone' => 'sometimes|string|max:20',
                'birthday' => 'sometimes|date',
                'address' => 'sometimes|string|max:500',
                'taste_preferences' => 'sometimes|array',
            ]);

            $user = Auth::user();

            // Update user name if provided
            if ($request->has('name')) {
                $user->name = $request->input('name');
                $user->save();
            }

            // Update or create customer profile
            $profileData = $request->only(['phone', 'birthday', 'address', 'taste_preferences']);
            $user->customerProfile()->updateOrCreate(
                ['user_id' => $user->id],
                $profileData
            );

            $user->refresh();
            $profile = $user->customerProfile;

            $profileData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $profile->phone ?? null,
                'birthday' => $profile->birthday ?? null,
                'address' => $profile->address ?? null,
                'taste_preferences' => $profile->taste_preferences ?? null,
            ];

            return $this->sendResponse($profileData, 'Profile updated successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to update profile', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get customer taste profile
    /**
     * Get customer taste preferences
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTastePreferences()
    {
        try {
            $user = Auth::user();
            $profile = $user->customerProfile;

            $tastePreferences = $profile ? ($profile->taste_preferences ?? []) : [];

            return $this->sendResponse([
                'taste_preferences' => $tastePreferences,
                'last_updated' => $profile ? $profile->updated_at : null,
            ], 'Taste preferences retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve taste preferences', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Update customer taste preferences
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateTastePreferences(Request $request)
    {
        try {
            $request->validate([
                'taste_profile' => 'required|array',
            ]);

            $user = Auth::user();

            // Update or create customer profile with taste preferences
            $user->customerProfile()->updateOrCreate(
                ['user_id' => $user->id],
                ['taste_preferences' => $request->input('taste_profile')]
            );

            return $this->sendResponse([
                'taste_preferences' => $request->input('taste_profile'),
                'updated_at' => now(),
            ], 'Taste preferences updated successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to update taste preferences', 500, ['error' => $e->getMessage()]);
        }
    }
}
