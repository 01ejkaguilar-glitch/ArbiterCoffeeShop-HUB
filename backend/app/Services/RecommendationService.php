<?php

namespace App\Services;

use App\Models\User;
use App\Models\Product;
use App\Models\Order;
use App\Models\CoffeeBean;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

/**
 * Rule-Based Recommendation Service
 * 
 * Provides product and coffee bean recommendations using collaborative filtering,
 * content-based filtering, and business rules - without machine learning.
 */
class RecommendationService
{
    /**
     * Generate product recommendations for a customer
     *
     * @param int $customerId
     * @param int $limit
     * @return array
     */
    public function getProductRecommendations(int $customerId, int $limit = 5): array
    {
        $cacheKey = "product_recommendations_{$customerId}";
        
        return Cache::remember($cacheKey, 3600, function () use ($customerId, $limit) {
            $recommendations = [];
            
            // 1. Collaborative Filtering: "Customers who bought X also bought Y"
            $collaborativeRecs = $this->getCollaborativeFilteringRecommendations($customerId, $limit);
            
            // 2. Content-Based: Similar products to what customer likes
            $contentBasedRecs = $this->getContentBasedRecommendations($customerId, $limit);
            
            // 3. Popularity-Based: Trending products
            $popularRecs = $this->getPopularityBasedRecommendations($limit);
            
            // 4. Time-Based: Seasonal or time-appropriate recommendations
            $timeBasedRecs = $this->getTimeBasedRecommendations($limit);
            
            // Merge and rank recommendations
            $recommendations = $this->mergeAndRankRecommendations([
                ['source' => 'collaborative', 'items' => $collaborativeRecs, 'weight' => 0.4],
                ['source' => 'content_based', 'items' => $contentBasedRecs, 'weight' => 0.3],
                ['source' => 'popular', 'items' => $popularRecs, 'weight' => 0.2],
                ['source' => 'time_based', 'items' => $timeBasedRecs, 'weight' => 0.1],
            ], $limit);
            
            return $recommendations;
        });
    }

    /**
     * Collaborative Filtering: Find products bought by similar customers
     */
    private function getCollaborativeFilteringRecommendations(int $customerId, int $limit): array
    {
        // Get products customer has already bought
        $customerProducts = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.user_id', $customerId)
            ->where('orders.status', 'completed')
            ->pluck('order_items.product_id')
            ->unique()
            ->toArray();

        if (empty($customerProducts)) {
            return [];
        }

        // Find customers who bought similar products
        $similarCustomers = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereIn('order_items.product_id', $customerProducts)
            ->where('orders.user_id', '!=', $customerId)
            ->where('orders.status', 'completed')
            ->select('orders.user_id')
            ->selectRaw('COUNT(DISTINCT order_items.product_id) as common_products')
            ->groupBy('orders.user_id')
            ->orderByDesc('common_products')
            ->limit(20)
            ->pluck('orders.user_id')
            ->toArray();

        if (empty($similarCustomers)) {
            return [];
        }

        // Find products bought by similar customers but not by current customer
        $recommendations = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->whereIn('orders.user_id', $similarCustomers)
            ->whereNotIn('order_items.product_id', $customerProducts)
            ->where('orders.status', 'completed')
            ->where('products.is_available', true)
            ->select([
                'products.id',
                'products.name',
                'products.description',
                'products.price',
                'products.image_url',
                'products.category_id',
                'products.is_available',
                'products.created_at',
                'products.updated_at'
            ])
            ->selectRaw('COUNT(order_items.id) as purchase_count')
            ->selectRaw('SUM(order_items.quantity) as total_quantity')
            ->groupBy([
                'products.id',
                'products.name',
                'products.description',
                'products.price',
                'products.image_url',
                'products.category_id',
                'products.is_available',
                'products.created_at',
                'products.updated_at'
            ])
            ->orderByDesc('purchase_count')
            ->limit($limit)
            ->get()
            ->map(function ($product) {
                return [
                    'product' => $product,
                    'score' => $product->purchase_count * 10, // Weight by purchase frequency
                    'reason' => 'Customers who bought similar items also purchased this',
                ];
            })
            ->toArray();

        return $recommendations;
    }

    /**
     * Content-Based Filtering: Recommend similar products based on category and attributes
     */
    private function getContentBasedRecommendations(int $customerId, int $limit): array
    {
        // Get customer's favorite categories
        $favoriteCategories = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.user_id', $customerId)
            ->where('orders.status', 'completed')
            ->select('products.category_id')
            ->selectRaw('COUNT(*) as purchase_count')
            ->groupBy('products.category_id')
            ->orderByDesc('purchase_count')
            ->limit(3)
            ->pluck('products.category_id')
            ->toArray();

        if (empty($favoriteCategories)) {
            return [];
        }

        // Get customer's purchased products
        $purchasedProducts = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.user_id', $customerId)
            ->pluck('order_items.product_id')
            ->unique()
            ->toArray();

        // Find similar products in favorite categories
        $recommendations = Product::whereIn('category_id', $favoriteCategories)
            ->whereNotIn('id', $purchasedProducts)
            ->where('is_available', true)
            ->limit($limit * 2)
            ->get()
            ->map(function ($product) use ($favoriteCategories) {
                $score = in_array($product->category_id, array_slice($favoriteCategories, 0, 1)) ? 10 : 5;
                return [
                    'product' => $product,
                    'score' => $score,
                    'reason' => 'Based on your favorite categories',
                ];
            })
            ->sortByDesc('score')
            ->take($limit)
            ->values()
            ->toArray();

        return $recommendations;
    }

    /**
     * Popularity-Based Recommendations: Top-selling products
     */
    private function getPopularityBasedRecommendations(int $limit): array
    {
        $recommendations = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.created_at', '>=', Carbon::now()->subDays(30))
            ->where('orders.status', 'completed')
            ->where('products.is_available', true)
            ->select([
                'products.id',
                'products.name',
                'products.description',
                'products.price',
                'products.image_url',
                'products.category_id',
                'products.is_available',
                'products.created_at',
                'products.updated_at'
            ])
            ->selectRaw('COUNT(order_items.id) as order_count')
            ->selectRaw('SUM(order_items.quantity) as total_sold')
            ->selectRaw('AVG(order_items.unit_price) as avg_price')
            ->groupBy([
                'products.id',
                'products.name',
                'products.description',
                'products.price',
                'products.image_url',
                'products.category_id',
                'products.is_available',
                'products.created_at',
                'products.updated_at'
            ])
            ->orderByDesc('order_count')
            ->limit($limit)
            ->get()
            ->map(function ($product) {
                return [
                    'product' => $product,
                    'score' => $product->order_count * 5,
                    'reason' => "Trending now - {$product->total_sold} sold this month",
                ];
            })
            ->toArray();

        return $recommendations;
    }

    /**
     * Time-Based Recommendations: Context-aware recommendations
     */
    private function getTimeBasedRecommendations(int $limit): array
    {
        $hour = Carbon::now()->hour;
        $dayOfWeek = Carbon::now()->dayOfWeek;
        $season = $this->getCurrentSeason();
        
        // Morning recommendations (6 AM - 11 AM)
        if ($hour >= 6 && $hour < 11) {
            $keywords = ['breakfast', 'morning', 'espresso', 'latte', 'croissant'];
        }
        // Afternoon recommendations (2 PM - 5 PM)
        elseif ($hour >= 14 && $hour < 17) {
            $keywords = ['snack', 'cake', 'pastry', 'iced', 'cold brew'];
        }
        // Evening recommendations (5 PM - 9 PM)
        elseif ($hour >= 17 && $hour < 21) {
            $keywords = ['dessert', 'decaf', 'tea'];
        }
        // Default
        else {
            $keywords = ['coffee', 'beverage'];
        }

        $recommendations = Product::where('is_available', true)
            ->where(function ($query) use ($keywords) {
                foreach ($keywords as $keyword) {
                    $query->orWhere('name', 'like', "%{$keyword}%")
                          ->orWhere('description', 'like', "%{$keyword}%");
                }
            })
            ->limit($limit)
            ->get()
            ->map(function ($product) use ($hour) {
                return [
                    'product' => $product,
                    'score' => 8,
                    'reason' => 'Perfect for this time of day',
                ];
            })
            ->toArray();

        return $recommendations;
    }

    /**
     * Coffee Bean Recommendations based on taste profile and purchase history
     */
    public function getCoffeeBeanRecommendations(int $customerId, int $limit = 5): array
    {
        $cacheKey = "coffee_bean_recommendations_{$customerId}";
        
        return Cache::remember($cacheKey, 3600, function () use ($customerId, $limit) {
            $recommendations = [];
            
            // Get customer's taste profile if exists
            $tasteProfile = DB::table('taste_profiles')->where('customer_id', $customerId)->first();
            
            // Get customer's previous coffee bean orders
            $previousBeans = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->join('categories', 'products.category_id', '=', 'categories.id')
                ->where('orders.user_id', $customerId)
                ->where('categories.name', 'like', '%coffee%')
                ->pluck('products.description')
                ->toArray();
            
            // Rule-based matching
            $beans = CoffeeBean::where('stock_quantity', '>', 0)->get();
            
            foreach ($beans as $bean) {
                $score = 0;
                $reasons = [];
                
                // Taste profile matching
                if ($tasteProfile) {
                    if ($tasteProfile->favorite_roast && stripos($bean->processing_method, $tasteProfile->favorite_roast) !== false) {
                        $score += 20;
                        $reasons[] = 'Matches your roast preference';
                    }
                    
                    if ($tasteProfile->flavor_preferences) {
                        $preferences = json_decode($tasteProfile->flavor_preferences, true);
                        foreach ($preferences as $pref) {
                            if (stripos($bean->tasting_notes, $pref) !== false) {
                                $score += 10;
                                $reasons[] = "Matches your taste for {$pref}";
                                break;
                            }
                        }
                    }
                }
                
                // Origin diversity (recommend beans from new origins)
                $hasTriedOrigin = false;
                foreach ($previousBeans as $prevBean) {
                    if (stripos($prevBean, $bean->origin_country) !== false) {
                        $hasTriedOrigin = true;
                        break;
                    }
                }
                if (!$hasTriedOrigin) {
                    $score += 15;
                    $reasons[] = 'Discover a new origin';
                }
                
                // Featured beans get bonus
                if ($bean->is_featured) {
                    $score += 25;
                    $reasons[] = 'Featured selection';
                }
                
                // Quality indicators (high elevation, specific varieties)
                if ($bean->elevation && (int)filter_var($bean->elevation, FILTER_SANITIZE_NUMBER_INT) > 1500) {
                    $score += 5;
                }
                
                if ($score > 0) {
                    $recommendations[] = [
                        'bean' => $bean,
                        'score' => $score,
                        'reasons' => $reasons,
                    ];
                }
            }
            
            // Sort by score and return top recommendations
            usort($recommendations, function ($a, $b) {
                return $b['score'] <=> $a['score'];
            });
            
            return array_slice($recommendations, 0, $limit);
        });
    }

    /**
     * Merge and rank recommendations from multiple sources
     */
    private function mergeAndRankRecommendations(array $sources, int $limit): array
    {
        $combinedScores = [];
        
        foreach ($sources as $source) {
            $weight = $source['weight'];
            foreach ($source['items'] as $item) {
                $productId = $item['product']->id;
                if (!isset($combinedScores[$productId])) {
                    $combinedScores[$productId] = [
                        'product' => $item['product'],
                        'score' => 0,
                        'reasons' => [],
                    ];
                }
                $combinedScores[$productId]['score'] += $item['score'] * $weight;
                $combinedScores[$productId]['reasons'][] = $item['reason'];
            }
        }
        
        // Sort by combined score
        uasort($combinedScores, function ($a, $b) {
            return $b['score'] <=> $a['score'];
        });
        
        return array_slice($combinedScores, 0, $limit);
    }

    /**
     * Get current season for seasonal recommendations
     */
    private function getCurrentSeason(): string
    {
        $month = Carbon::now()->month;
        
        if ($month >= 3 && $month <= 5) return 'spring';
        if ($month >= 6 && $month <= 8) return 'summer';
        if ($month >= 9 && $month <= 11) return 'fall';
        return 'winter';
    }

    /**
     * Calculate customer affinity score for product recommendations
     */
    public function calculateCustomerAffinityScore(int $customerId, int $productId): float
    {
        // Purchase frequency
        $purchaseCount = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.user_id', $customerId)
            ->where('order_items.product_id', $productId)
            ->count();
        
        // Recency (days since last purchase)
        $lastPurchase = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.user_id', $customerId)
            ->where('order_items.product_id', $productId)
            ->max('orders.created_at');
        
        $recencyScore = 0;
        if ($lastPurchase) {
            $daysSince = Carbon::parse($lastPurchase)->diffInDays(Carbon::now());
            $recencyScore = max(0, 100 - $daysSince); // Decays over time
        }
        
        // Quantity purchased
        $totalQuantity = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.user_id', $customerId)
            ->where('order_items.product_id', $productId)
            ->sum('order_items.quantity');
        
        // Combined score (RFM-like scoring)
        $frequencyScore = min(100, $purchaseCount * 20);
        $monetaryScore = min(100, $totalQuantity * 10);
        
        $affinityScore = ($recencyScore * 0.3) + ($frequencyScore * 0.4) + ($monetaryScore * 0.3);
        
        return round($affinityScore, 2);
    }

    /**
     * Clear recommendation cache for a customer
     */
    public function clearCustomerRecommendationCache(int $customerId): void
    {
        Cache::forget("product_recommendations_{$customerId}");
        Cache::forget("coffee_bean_recommendations_{$customerId}");
    }
}
