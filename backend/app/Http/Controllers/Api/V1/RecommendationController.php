<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseController;
use App\Services\RecommendationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RecommendationController extends BaseController
{
    protected $recommendationService;

    public function __construct(RecommendationService $recommendationService)
    {
        $this->recommendationService = $recommendationService;
    }

    /**
     * Get product recommendations for authenticated customer
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getProductRecommendations(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'limit' => 'nullable|integer|min:1|max:20',
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', 422, $validator->errors()->toArray());
            }

            $customerId = $request->user()->id;
            $limit = $request->get('limit', 5);

            $recommendations = $this->recommendationService->getProductRecommendations($customerId, $limit);

            return $this->sendResponse($recommendations, 'Product recommendations retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Error retrieving recommendations', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get coffee bean recommendations for authenticated customer
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCoffeeBeanRecommendations(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'limit' => 'nullable|integer|min:1|max:20',
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', 422, $validator->errors()->toArray());
            }

            $customerId = $request->user()->id;
            $limit = $request->get('limit', 5);

            $recommendations = $this->recommendationService->getCoffeeBeanRecommendations($customerId, $limit);

            return $this->sendResponse($recommendations, 'Coffee bean recommendations retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Error retrieving coffee bean recommendations', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Calculate customer affinity score for a specific product
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCustomerAffinityScore(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'product_id' => 'required|integer|exists:products,id',
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error', 422, $validator->errors()->toArray());
            }

            $customerId = $request->user()->id;
            $productId = $request->get('product_id');

            $score = $this->recommendationService->calculateCustomerAffinityScore($customerId, $productId);

            return $this->sendResponse([
                'customer_id' => $customerId,
                'product_id' => $productId,
                'affinity_score' => $score,
                'interpretation' => $this->interpretAffinityScore($score),
            ], 'Affinity score calculated successfully');
        } catch (\Exception $e) {
            return $this->sendError('Error calculating affinity score', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Clear recommendation cache for authenticated customer
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function clearRecommendationCache(Request $request)
    {
        try {
            $customerId = $request->user()->id;
            $this->recommendationService->clearCustomerRecommendationCache($customerId);

            return $this->sendResponse(null, 'Recommendation cache cleared successfully');
        } catch (\Exception $e) {
            return $this->sendError('Error clearing cache', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get personalized homepage recommendations
     * Combines products and coffee beans for a complete experience
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getHomepageRecommendations(Request $request)
    {
        try {
            // Check if user is authenticated
            if ($request->user()) {
                // Authenticated user - return personalized recommendations
                $customerId = $request->user()->id;

                $products = $this->recommendationService->getProductRecommendations($customerId, 4);
                $coffeeBeans = $this->recommendationService->getCoffeeBeanRecommendations($customerId, 3);

                return $this->sendResponse([
                    'recommended_products' => $products,
                    'recommended_coffee_beans' => $coffeeBeans,
                    'personalization_level' => $this->calculatePersonalizationLevel($customerId),
                    'is_authenticated' => true,
                ], 'Personalized homepage recommendations retrieved successfully');
            } else {
                // Guest user - return popular products
                $popularProducts = $this->getPopularProducts(4);
                $featuredCoffeeBeans = $this->getFeaturedCoffeeBeans(3);

                return $this->sendResponse([
                    'recommended_products' => $popularProducts,
                    'recommended_coffee_beans' => $featuredCoffeeBeans,
                    'personalization_level' => 'None - General Recommendations',
                    'is_authenticated' => false,
                ], 'Popular products retrieved successfully');
            }
        } catch (\Exception $e) {
            return $this->sendError('Error retrieving homepage recommendations', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Interpret affinity score for human-readable output
     *
     * @param float $score
     * @return string
     */
    private function interpretAffinityScore(float $score): string
    {
        if ($score >= 80) return 'Highly Recommended - Strong Match';
        if ($score >= 60) return 'Recommended - Good Match';
        if ($score >= 40) return 'May Like - Moderate Match';
        if ($score >= 20) return 'Consider - Low Match';
        return 'New - No History';
    }

    /**
     * Calculate how personalized the recommendations are
     * Based on available customer data
     *
     * @param int $customerId
     * @return string
     */
    private function calculatePersonalizationLevel(int $customerId): string
    {
        $user = \App\Models\User::with(['orders', 'tasteProfile'])->find($customerId);

        $hasOrders = $user->orders->count() > 0;
        $hasTasteProfile = $user->tasteProfile !== null;
        $orderCount = $user->orders->count();

        if ($orderCount >= 10 && $hasTasteProfile) {
            return 'High - Highly Personalized';
        } elseif ($orderCount >= 3 || $hasTasteProfile) {
            return 'Medium - Partially Personalized';
        } elseif ($orderCount > 0) {
            return 'Low - Basic Personalization';
        }

        return 'None - General Recommendations';
    }

    /**
     * Get popular products for guest users
     *
     * @param int $limit
     * @return array
     */
    private function getPopularProducts(int $limit = 4): array
    {
        try {
            // Get products ordered by total orders in the last 30 days
            // Simplified query to avoid MySQL 8.0 GROUP BY issues
            $productIds = \DB::table('order_items')
                ->select('product_id', \DB::raw('COUNT(*) as order_count'))
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->where('orders.created_at', '>=', now()->subDays(30))
                ->where('orders.status', '!=', 'cancelled')
                ->groupBy('product_id')
                ->orderBy('order_count', 'desc')
                ->limit($limit * 2) // Get more to filter
                ->pluck('product_id');

            if ($productIds->isEmpty()) {
                // Fallback: get any available products
                $products = \App\Models\Product::where('is_available', true)
                    ->orderBy('created_at', 'desc')
                    ->limit($limit)
                    ->get();
            } else {
                // Get the actual products
                $products = \App\Models\Product::whereIn('id', $productIds)
                    ->where('is_available', true)
                    ->get();
            }

            return $products->take($limit)->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'price' => $product->price,
                    'image_url' => $product->image_url,
                    'category' => $product->category,
                    'stock_quantity' => $product->stock_quantity,
                    'is_available' => $product->is_available,
                    'reason' => 'Popular this month',
                ];
            })->toArray();
        } catch (\Exception $e) {
            // Fallback: get any available products
            $products = \App\Models\Product::where('is_available', true)
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get();

            return $products->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'price' => $product->price,
                    'image_url' => $product->image_url,
                    'category' => $product->category,
                    'stock_quantity' => $product->stock_quantity,
                    'is_available' => $product->is_available,
                    'reason' => 'Featured selection',
                ];
            })->toArray();
        }
    }

    /**
     * Get featured coffee beans for guest users
     *
     * @param int $limit
     * @return array
     */
    private function getFeaturedCoffeeBeans(int $limit = 3): array
    {
        // Get featured coffee beans
        $coffeeBeans = \App\Models\CoffeeBean::where('is_featured', true)
            ->where('stock_quantity', '>', 0)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return $coffeeBeans->map(function ($bean) {
            return [
                'id' => $bean->id,
                'name' => $bean->name,
                'origin' => $bean->origin,
                'description' => $bean->description,
                'price_per_kg' => $bean->price_per_kg,
                'image_url' => $bean->image_url,
                'stock_quantity' => $bean->stock_quantity,
                'is_featured' => $bean->is_featured,
                'reason' => 'Featured selection',
            ];
        })->toArray();
    }
}
