<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use App\Models\User;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

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
                'profile_picture' => $profile->profile_picture ?? null,
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
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'phone' => 'sometimes|nullable|string|max:20',
                'birthday' => 'sometimes|nullable|date',
                'address' => 'sometimes|nullable|string|max:500',
                'taste_preferences' => 'sometimes|nullable|array',
            ]);

            $user = Auth::user();

            // Update user name if provided
            if ($request->has('name')) {
                $user->name = $validated['name'];
                $user->save();
            }

            // Prepare profile data
            $profileData = [];
            if (isset($validated['phone'])) $profileData['phone'] = $validated['phone'];
            if (isset($validated['birthday'])) $profileData['birthday'] = $validated['birthday'];
            if (isset($validated['address'])) $profileData['address'] = $validated['address'];
            if (isset($validated['taste_preferences'])) $profileData['taste_preferences'] = $validated['taste_preferences'];

            // Update or create customer profile only if there's data to update
            if (!empty($profileData)) {
                $user->customerProfile()->updateOrCreate(
                    ['user_id' => $user->id],
                    $profileData
                );
            }

            $user->refresh();
            $profile = $user->customerProfile;

            $responseData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $profile->phone ?? null,
                'birthday' => $profile->birthday ?? null,
                'address' => $profile->address ?? null,
                'taste_preferences' => $profile->taste_preferences ?? null,
                'profile_picture' => $profile->profile_picture ?? null,
            ];

            return $this->sendResponse($responseData, 'Profile updated successfully');
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

    /**
     * Get customer order analytics
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getOrderAnalytics()
    {
        try {
            $user = Auth::user();

            // Get order statistics
            $totalOrders = Order::where('user_id', $user->id)->count();
            $totalSpent = Order::where('user_id', $user->id)
                ->where('payment_status', 'paid')
                ->sum('total_amount');
            $averageOrderValue = $totalOrders > 0 ? $totalSpent / $totalOrders : 0;

            // Get favorite items (most ordered products)
            $favoriteItems = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->where('orders.user_id', $user->id)
                ->select(
                    'products.id',
                    'products.name',
                    'products.image_url',
                    DB::raw('SUM(order_items.quantity) as total_quantity'),
                    DB::raw('COUNT(DISTINCT orders.id) as order_count')
                )
                ->groupBy('products.id', 'products.name', 'products.image_url')
                ->orderBy('total_quantity', 'desc')
                ->limit(5)
                ->get();

            // Get most ordered category
            $mostOrderedCategory = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->join('categories', 'products.category_id', '=', 'categories.id')
                ->where('orders.user_id', $user->id)
                ->select(
                    'categories.id',
                    'categories.name',
                    DB::raw('COUNT(order_items.id) as item_count')
                )
                ->groupBy('categories.id', 'categories.name')
                ->orderBy('item_count', 'desc')
                ->first();

            // Get monthly order frequency
            $orderFrequency = DB::table('orders')
                ->where('user_id', $user->id)
                ->select(
                    DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                    DB::raw('COUNT(*) as order_count')
                )
                ->groupBy('month')
                ->orderBy('month', 'desc')
                ->limit(12)
                ->get();

            return $this->sendResponse([
                'total_orders' => $totalOrders,
                'total_spent' => number_format($totalSpent, 2),
                'average_order_value' => number_format($averageOrderValue, 2),
                'favorite_items' => $favoriteItems,
                'most_ordered_category' => $mostOrderedCategory,
                'order_frequency' => $orderFrequency,
            ], 'Order analytics retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve analytics', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Upload profile picture
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadProfilePicture(Request $request)
    {
        try {
            $request->validate([
                'profile_picture' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            $user = Auth::user();

            // Handle image upload
            if ($request->hasFile('profile_picture')) {
                $image = $request->file('profile_picture');
                $imageName = 'profile_' . $user->id . '_' . time() . '.' . $image->getClientOriginalExtension();
                $imagePath = $image->storeAs('profiles', $imageName, 'public');
                
                $profilePictureUrl = '/storage/' . $imagePath;

                // Update profile picture
                $user->customerProfile()->updateOrCreate(
                    ['user_id' => $user->id],
                    ['profile_picture' => $profilePictureUrl]
                );

                return $this->sendResponse([
                    'profile_picture' => $profilePictureUrl
                ], 'Profile picture uploaded successfully');
            }

            return $this->sendError('No file uploaded', 400);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to upload profile picture', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Update notification preferences
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateNotificationPreferences(Request $request)
    {
        try {
            $request->validate([
                'email_notifications' => 'boolean',
                'sms_notifications' => 'boolean',
                'order_updates' => 'boolean',
                'promotional_offers' => 'boolean',
            ]);

            $user = Auth::user();

            $preferences = $request->only([
                'email_notifications',
                'sms_notifications',
                'order_updates',
                'promotional_offers'
            ]);

            // Get current taste preferences
            $profile = $user->customerProfile;
            $tastePreferences = $profile ? ($profile->taste_preferences ?? []) : [];

            // Merge notification preferences with taste preferences
            $tastePreferences['notification_preferences'] = $preferences;

            $user->customerProfile()->updateOrCreate(
                ['user_id' => $user->id],
                ['taste_preferences' => $tastePreferences]
            );

            return $this->sendResponse($preferences, 'Notification preferences updated successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to update notification preferences', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get user's favorite products
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getFavorites()
    {
        try {
            $user = Auth::user();

            // Get favorite products with full product details
            $favorites = DB::table('customer_favorites')
                ->join('products', 'customer_favorites.product_id', '=', 'products.id')
                ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
                ->where('customer_favorites.user_id', $user->id)
                ->where('products.is_available', true)
                ->select(
                    'customer_favorites.id as favorite_id',
                    'products.id',
                    'products.name',
                    'products.description',
                    'products.price',
                    'products.image_url',
                    'products.category_id',
                    'categories.name as category_name',
                    'customer_favorites.created_at as favorited_at'
                )
                ->orderBy('customer_favorites.created_at', 'desc')
                ->get();

            // Format favorites to match frontend expectations
            $formattedFavorites = $favorites->map(function ($favorite) {
                return [
                    'id' => $favorite->favorite_id,
                    'product' => [
                        'id' => $favorite->id,
                        'name' => $favorite->name,
                        'description' => $favorite->description,
                        'price' => $favorite->price,
                        'image_url' => $favorite->image_url,
                        'category_id' => $favorite->category_id,
                        'category_name' => $favorite->category_name,
                    ],
                    'added_at' => $favorite->favorited_at,
                ];
            });

            return $this->sendResponse($formattedFavorites, 'Favorites retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to retrieve favorites', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Add product to favorites
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function addFavorite(Request $request)
    {
        try {
            $request->validate([
                'product_id' => 'required|integer|exists:products,id'
            ]);

            $user = Auth::user();
            $productId = $request->product_id;

            // Check if product exists and is available
            $product = Product::where('id', $productId)
                ->where('is_available', true)
                ->first();

            if (!$product) {
                return $this->sendError('Product not found or unavailable', 404);
            }

            // Check if already favorited
            $exists = DB::table('customer_favorites')
                ->where('user_id', $user->id)
                ->where('product_id', $productId)
                ->exists();

            if ($exists) {
                return $this->sendError('Product already in favorites', 409);
            }

            // Add to favorites
            DB::table('customer_favorites')->insert([
                'user_id' => $user->id,
                'product_id' => $productId,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return $this->sendResponse([
                'product_id' => $productId,
                'is_favorited' => true
            ], 'Product added to favorites');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to add favorite', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Remove product from favorites
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function removeFavorite($id)
    {
        try {
            $user = Auth::user();

            $deleted = DB::table('customer_favorites')
                ->where('user_id', $user->id)
                ->where('product_id', $id)
                ->delete();

            if ($deleted === 0) {
                return $this->sendError('Favorite not found', 404);
            }

            return $this->sendResponse([
                'product_id' => (int) $id,
                'is_favorited' => false
            ], 'Product removed from favorites');

        } catch (\Exception $e) {
            return $this->sendError('Failed to remove favorite', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Deactivate customer account
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function deactivateAccount(Request $request)
    {
        try {
            $request->validate([
                'reason' => 'sometimes|string|max:500',
                'password' => 'required|string',
            ]);

            $user = Auth::user();

            // Verify password
            if (!Hash::check($request->input('password'), $user->password)) {
                return $this->sendError('Invalid password', 400);
            }

            // Soft delete the user account
            $user->update([
                'email' => 'deactivated_' . time() . '_' . $user->email,
                'deleted_at' => now(),
            ]);

            // Log the deactivation reason if provided
            if ($request->has('reason')) {
                Log::info('Account deactivated', [
                    'user_id' => $user->id,
                    'reason' => $request->input('reason'),
                ]);
            }

            // Logout the user
            Auth::logout();

            return $this->sendResponse(null, 'Account deactivated successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to deactivate account', 500, ['error' => $e->getMessage()]);
        }
    }

    public function toggleFavorite(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            $request->validate([
                'product_id' => 'required|integer|exists:products,id'
            ]);

            $productId = $request->product_id;

            // Check if product exists and is available
            $product = Product::where('id', $productId)
                ->where('is_available', true)
                ->first();

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found or unavailable'
                ], 404);
            }

            // Check if already favorited
            $exists = DB::table('customer_favorites')
                ->where('user_id', $user->id)
                ->where('product_id', $productId)
                ->exists();

            if ($exists) {
                // Remove from favorites
                DB::table('customer_favorites')
                    ->where('user_id', $user->id)
                    ->where('product_id', $productId)
                    ->delete();

                return response()->json([
                    'success' => true,
                    'message' => 'Product removed from favorites',
                    'data' => [
                        'product_id' => $productId,
                        'is_favorited' => false
                    ]
                ]);
            } else {
                // Add to favorites
                DB::table('customer_favorites')->insert([
                    'user_id' => $user->id,
                    'product_id' => $productId,
                    'created_at' => \Carbon\Carbon::now(),
                    'updated_at' => \Carbon\Carbon::now()
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Product added to favorites',
                    'data' => [
                        'product_id' => $productId,
                        'is_favorited' => true
                    ]
                ]);
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle favorite',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
