<?php

namespace App\Services;

use App\Models\User;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Customer Insights Service
 * 
 * Provides rule-based customer behavior analysis, engagement scoring,
 * and actionable insights without machine learning.
 */
class CustomerInsightsService
{
    /**
     * Generate comprehensive customer insights
     *
     * @param int $customerId
     * @return array
     */
    public function generateCustomerInsights(int $customerId): array
    {
        $cacheKey = "customer_insights_{$customerId}";
        
        return Cache::remember($cacheKey, 3600, function () use ($customerId) {
            return [
                'purchase_behavior' => $this->analyzePurchaseBehavior($customerId),
                'product_affinity' => $this->analyzeProductAffinity($customerId),
                'engagement_score' => $this->calculateEngagementScore($customerId),
                'satisfaction_indicators' => $this->analyzeSatisfaction($customerId),
                'predictions' => $this->generatePredictions($customerId),
                'lifecycle_stage' => $this->identifyLifecycleStage($customerId),
                'recommendations' => $this->getActionableRecommendations($customerId),
            ];
        });
    }

    /**
     * Analyze purchase behavior patterns
     *
     * @param int $customerId
     * @return array
     */
    private function analyzePurchaseBehavior(int $customerId): array
    {
        $orders = Order::where('user_id', $customerId)
            ->where('status', 'completed')
            ->orderBy('created_at')
            ->get();

        if ($orders->isEmpty()) {
            return ['status' => 'insufficient_data'];
        }

        // Calculate metrics
        $totalOrders = $orders->count();
        $totalSpent = $orders->sum('total_amount');
        $avgOrderValue = $totalSpent / $totalOrders;
        
        // Frequency tier
        $ordersPerMonth = $totalOrders / max(1, $orders->first()->created_at->diffInMonths(now()));
        $frequencyTier = $this->determineFrequencyTier($ordersPerMonth);
        
        // Spending tier
        $spendingTier = $this->determineSpendingTier($avgOrderValue);
        
        // Spending trend
        $spendingTrend = $this->analyzeSpendingTrend($orders);
        
        // Time patterns
        $timePattern = $this->analyzeTimePatterns($orders);
        
        // Order intervals
        $intervals = [];
        for ($i = 1; $i < $totalOrders; $i++) {
            $intervals[] = $orders[$i]->created_at->diffInDays($orders[$i-1]->created_at);
        }
        $avgInterval = count($intervals) > 0 ? array_sum($intervals) / count($intervals) : null;
        
        // Days since last order
        $lastOrderDate = $orders->last()->created_at;
        $daysSinceLastOrder = $lastOrderDate->diffInDays(now());
        
        return [
            'total_orders' => $totalOrders,
            'total_spent' => round($totalSpent, 2),
            'avg_order_value' => round($avgOrderValue, 2),
            'frequency_tier' => $frequencyTier,
            'spending_tier' => $spendingTier,
            'spending_trend' => $spendingTrend,
            'time_pattern' => $timePattern,
            'avg_days_between_orders' => $avgInterval ? round($avgInterval, 1) : null,
            'first_order_date' => $orders->first()->created_at->toDateString(),
            'last_order_date' => $orders->last()->created_at->toDateString(),
            'days_since_last_order' => $daysSinceLastOrder,
        ];
    }

    /**
     * Analyze product affinity
     *
     * @param int $customerId
     * @return array
     */
    private function analyzeProductAffinity(int $customerId): array
    {
        // Get favorite categories
        $favoriteCategories = $this->getFavoriteCategories($customerId);
        
        // Get favorite products
        $favoriteProducts = $this->getFavoriteProducts($customerId);
        
        // Get product combinations (basket analysis)
        $productCombinations = $this->analyzeProductCombinations($customerId);
        
        // Get taste profile
        $tasteProfile = $this->discoverTasteProfile($customerId);
        
        return [
            'favorite_categories' => $favoriteCategories,
            'favorite_products' => $favoriteProducts,
            'product_combinations' => $productCombinations,
            'taste_profile' => $tasteProfile,
        ];
    }

    /**
     * Get favorite categories with scoring
     *
     * @param int $customerId
     * @return array
     */
    private function getFavoriteCategories(int $customerId): array
    {
        $categoryStats = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->where('orders.user_id', $customerId)
            ->where('orders.status', 'completed')
            ->select(
                'categories.id as category_id',
                'categories.name as category_name',
                DB::raw('COUNT(DISTINCT order_items.order_id) as order_count'),
                DB::raw('SUM(order_items.quantity * order_items.unit_price) as total_spent'),
                DB::raw('MAX(orders.created_at) as last_purchase')
            )
            ->groupBy('categories.id', 'categories.name')
            ->get();

        $favorites = [];
        foreach ($categoryStats as $stat) {
            if (!$stat->category_id) continue;
            
            $orderCount = $stat->order_count;
            $totalSpent = $stat->total_spent;
            $daysSinceLastPurchase = Carbon::parse($stat->last_purchase)->diffInDays(now());
            $recencyScore = max(0, 100 - $daysSinceLastPurchase) / 100;
            
            // Calculate category score
            $score = ($orderCount * 0.4) + 
                    (($totalSpent / 10) * 0.4) + 
                    ($recencyScore * 0.2);
            
            $favorites[] = [
                'category_id' => $stat->category_id,
                'category' => $stat->category_name,
                'score' => round($score, 2),
                'order_count' => $orderCount,
                'total_spent' => round($totalSpent, 2),
                'last_purchase' => Carbon::parse($stat->last_purchase)->diffForHumans(),
            ];
        }

        // Sort by score and return top 3
        usort($favorites, function($a, $b) {
            return $b['score'] <=> $a['score'];
        });

        return array_slice($favorites, 0, 3);
    }

    /**
     * Get favorite products with scoring
     *
     * @param int $customerId
     * @return array
     */
    private function getFavoriteProducts(int $customerId): array
    {
        $productStats = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.user_id', $customerId)
            ->where('orders.status', 'completed')
            ->select(
                'products.id',
                'products.name',
                'products.price',
                'products.image_url',
                DB::raw('COUNT(order_items.id) as order_count'),
                DB::raw('SUM(order_items.quantity) as total_quantity'),
                DB::raw('MAX(orders.created_at) as last_purchase')
            )
            ->groupBy('products.id', 'products.name', 'products.price', 'products.image_url')
            ->orderByDesc('order_count')
            ->limit(5)
            ->get();

        $favorites = [];
        foreach ($productStats as $stat) {
            $orderCount = $stat->order_count;
            $totalQuantity = $stat->total_quantity;
            $daysSinceLastPurchase = Carbon::parse($stat->last_purchase)->diffInDays(now());
            $recencyScore = max(0, 100 - $daysSinceLastPurchase) / 100;

            // Calculate product score
            $score = ($orderCount * 0.5) +
                    ($totalQuantity * 0.3) +
                    ($recencyScore * 0.2);

            $favorites[] = [
                'id' => $stat->id,
                'name' => $stat->name,
                'price' => $stat->price,
                'image_url' => $stat->image_url,
                'score' => round($score, 2),
                'order_count' => $orderCount,
                'total_quantity' => $totalQuantity,
                'last_purchase' => Carbon::parse($stat->last_purchase)->diffForHumans(),
            ];
        }

        // Sort by score and return top 5
        usort($favorites, function($a, $b) {
            return $b['score'] <=> $a['score'];
        });

        return array_slice($favorites, 0, 5);
    }

    /**
     * Analyze product combinations (basket analysis)
     *
     * @param int $customerId
     * @return array
     */
    private function analyzeProductCombinations(int $customerId): array
    {
        // Get orders with multiple items
        $orders = Order::where('user_id', $customerId)
            ->where('status', 'completed')
            ->with('items.product')
            ->get();

        $combinations = [];
        $totalOrders = $orders->count();

        foreach ($orders as $order) {
            if ($order->items->count() < 2) continue;

            $products = $order->items->pluck('product.name')->toArray();
            
            // Create pairs
            for ($i = 0; $i < count($products); $i++) {
                for ($j = $i + 1; $j < count($products); $j++) {
                    $pair = [$products[$i], $products[$j]];
                    sort($pair);
                    $key = implode(' + ', $pair);
                    
                    if (!isset($combinations[$key])) {
                        $combinations[$key] = 0;
                    }
                    $combinations[$key]++;
                }
            }
        }

        // Calculate strength and format results
        $results = [];
        foreach ($combinations as $combo => $count) {
            $strength = round(($count / max(1, $totalOrders)) * 100, 1);
            $results[] = [
                'combination' => $combo,
                'times_bought_together' => $count,
                'strength' => $strength,
            ];
        }

        // Sort by strength
        usort($results, function($a, $b) {
            return $b['times_bought_together'] <=> $a['times_bought_together'];
        });

        return array_slice($results, 0, 5);
    }

    /**
     * Discover taste profile from coffee purchases
     *
     * @param int $customerId
     * @return array
     */
    private function discoverTasteProfile(int $customerId): array
    {
        // Get coffee-related purchases
        $coffeeOrders = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->where('orders.user_id', $customerId)
            ->where('orders.status', 'completed')
            ->where(function($query) {
                $query->where('categories.name', 'like', '%coffee%')
                      ->orWhere('products.name', 'like', '%coffee%')
                      ->orWhere('products.description', 'like', '%roast%');
            })
            ->select('products.name', 'products.description')
            ->get();

        if ($coffeeOrders->isEmpty()) {
            return ['status' => 'no_coffee_purchases'];
        }

        // Extract flavor descriptors
        $flavorKeywords = [
            'chocolaty' => 0, 'nutty' => 0, 'fruity' => 0, 'floral' => 0,
            'bright' => 0, 'smooth' => 0, 'bold' => 0, 'mild' => 0,
            'rich' => 0, 'sweet' => 0, 'citrus' => 0, 'berry' => 0,
        ];

        $roastCounts = ['light' => 0, 'medium' => 0, 'dark' => 0];

        foreach ($coffeeOrders as $order) {
            $text = strtolower($order->name . ' ' . $order->description);
            
            foreach ($flavorKeywords as $keyword => $count) {
                if (stripos($text, $keyword) !== false) {
                    $flavorKeywords[$keyword]++;
                }
            }

            foreach ($roastCounts as $roast => $count) {
                if (stripos($text, $roast) !== false) {
                    $roastCounts[$roast]++;
                }
            }
        }

        // Get top flavors
        arsort($flavorKeywords);
        $topFlavors = array_slice(array_keys($flavorKeywords), 0, 5);
        $topFlavors = array_filter($topFlavors, function($key) use ($flavorKeywords) {
            return $flavorKeywords[$key] > 0;
        });

        // Determine favorite roast
        arsort($roastCounts);
        $favoriteRoast = array_key_first($roastCounts);
        if ($roastCounts[$favoriteRoast] === 0) {
            $favoriteRoast = 'unknown';
        }

        // Determine profile type
        $profile = 'TRADITIONAL';
        if (in_array('fruity', $topFlavors) || in_array('bright', $topFlavors)) {
            $profile = 'ADVENTUROUS';
        } elseif (in_array('smooth', $topFlavors) || in_array('mild', $topFlavors)) {
            $profile = 'GENTLE';
        } elseif (in_array('bold', $topFlavors) || in_array('rich', $topFlavors)) {
            $profile = 'INTENSE';
        }

        return [
            'profile_type' => $profile,
            'favorite_roast' => $favoriteRoast,
            'flavor_preferences' => array_values($topFlavors),
            'roast_counts' => $roastCounts,
        ];
    }

    /**
     * Calculate Customer Engagement Index
     *
     * @param int $customerId
     * @return array
     */
    private function calculateEngagementScore(int $customerId): array
    {
        $user = User::findOrFail($customerId);
        $orders = Order::where('user_id', $customerId)
            ->where('status', 'completed')
            ->where('created_at', '>=', now()->subDays(90))
            ->get();

        // 1. Purchase Frequency (30%)
        $frequencyScore = ($orders->count() / 90) * 100;
        $frequencyScore = min(100, $frequencyScore * 10); // Normalize
        
        // 2. Monetary Value (25%)
        $totalSpent = $orders->sum('total_amount');
        $avgCustomerSpent = Order::where('status', 'completed')
            ->where('created_at', '>=', now()->subDays(90))
            ->avg('total_amount') * 10; // Approximate avg per customer
        $monetaryScore = min(100, ($totalSpent / max(1, $avgCustomerSpent)) * 100);
        
        // 3. Recency (20%)
        $lastOrder = $orders->sortByDesc('created_at')->first();
        $recencyScore = $lastOrder 
            ? max(0, 100 - $lastOrder->created_at->diffInDays(now()))
            : 0;
        
        // 4. Product Diversity (15%)
        $uniqueProducts = OrderItem::whereIn('order_id', $orders->pluck('id'))
            ->distinct('product_id')
            ->count('product_id');
        $totalProducts = Product::where('is_available', true)->count();
        $diversityScore = ($uniqueProducts / max(1, $totalProducts)) * 100;
        
        // 5. Interaction Level (10%) - placeholder, can be enhanced
        $interactionScore = 50; // Default middle score
        
        // Calculate weighted CEI
        $cei = ($frequencyScore * 0.30) +
               ($monetaryScore * 0.25) +
               ($recencyScore * 0.20) +
               ($diversityScore * 0.15) +
               ($interactionScore * 0.10);
        
        $engagementLevel = $this->determineEngagementLevel($cei);
        
        return [
            'cei_score' => round($cei, 2),
            'engagement_level' => $engagementLevel,
            'components' => [
                'frequency' => round($frequencyScore, 2),
                'monetary' => round($monetaryScore, 2),
                'recency' => round($recencyScore, 2),
                'diversity' => round($diversityScore, 2),
                'interaction' => round($interactionScore, 2),
            ],
        ];
    }

    /**
     * Analyze customer satisfaction indicators
     *
     * @param int $customerId
     * @return array
     */
    private function analyzeSatisfaction(int $customerId): array
    {
        $score = 0;
        $signals = [];

        $orders = Order::where('user_id', $customerId)
            ->where('status', 'completed')
            ->orderBy('created_at')
            ->get();

        if ($orders->isEmpty()) {
            return ['status' => 'insufficient_data'];
        }

        // Positive signals
        // Repeat purchases of same product
        $repeatPurchases = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.user_id', $customerId)
            ->where('orders.status', 'completed')
            ->select('order_items.product_id', DB::raw('COUNT(*) as purchase_count'))
            ->groupBy('order_items.product_id')
            ->having('purchase_count', '>', 1)
            ->count();

        if ($repeatPurchases > 0) {
            $points = $repeatPurchases * 10;
            $score += $points;
            $signals[] = ['type' => 'positive', 'signal' => 'Repeat purchases', 'points' => $points];
        }

        // Increasing order frequency (compare first half vs second half)
        $midPoint = ceil($orders->count() / 2);
        $firstHalf = $orders->take($midPoint);
        $secondHalf = $orders->slice($midPoint);

        if ($secondHalf->count() > 0) {
            $firstHalfDays = $firstHalf->last()->created_at->diffInDays($firstHalf->first()->created_at);
            $secondHalfDays = $secondHalf->last()->created_at->diffInDays($secondHalf->first()->created_at);
            
            if ($firstHalfDays > 0 && $secondHalfDays > 0) {
                $firstFreq = $firstHalf->count() / $firstHalfDays;
                $secondFreq = $secondHalf->count() / $secondHalfDays;
                
                if ($secondFreq > $firstFreq) {
                    $score += 5;
                    $signals[] = ['type' => 'positive', 'signal' => 'Increasing order frequency', 'points' => 5];
                }
            }
        }

        // Higher AOV over time
        if ($orders->count() >= 4) {
            $recentOrders = $orders->slice(-4);
            $olderOrders = $orders->take(4);
            
            $recentAOV = $recentOrders->avg('total_amount');
            $olderAOV = $olderOrders->avg('total_amount');
            
            if ($recentAOV > $olderAOV * 1.1) {
                $score += 5;
                $signals[] = ['type' => 'positive', 'signal' => 'Increasing order value', 'points' => 5];
            }
        }

        // Negative signals
        // Long gaps between orders
        $intervals = [];
        for ($i = 1; $i < $orders->count(); $i++) {
            $intervals[] = $orders[$i]->created_at->diffInDays($orders[$i-1]->created_at);
        }

        $longGaps = array_filter($intervals, function($interval) {
            return $interval > 60;
        });

        if (count($longGaps) > 0) {
            $points = count($longGaps) * -5;
            $score += $points;
            $signals[] = ['type' => 'negative', 'signal' => 'Long gaps between orders', 'points' => $points];
        }

        // Determine satisfaction level
        $level = 'NEUTRAL';
        if ($score >= 80) $level = 'DELIGHTED';
        elseif ($score >= 50) $level = 'SATISFIED';
        elseif ($score >= 20) $level = 'NEUTRAL';
        elseif ($score >= 0) $level = 'DISSATISFIED';
        else $level = 'UNHAPPY';

        return [
            'satisfaction_score' => $score,
            'satisfaction_level' => $level,
            'signals' => $signals,
        ];
    }

    /**
     * Generate predictive insights
     *
     * @param int $customerId
     * @return array
     */
    private function generatePredictions(int $customerId): array
    {
        $orders = Order::where('user_id', $customerId)
            ->where('status', 'completed')
            ->orderBy('created_at')
            ->get();

        if ($orders->count() < 2) {
            return ['status' => 'insufficient_data'];
        }

        // Calculate purchase intervals
        $intervals = [];
        for ($i = 1; $i < $orders->count(); $i++) {
            $intervals[] = $orders[$i]->created_at->diffInDays($orders[$i-1]->created_at);
        }

        $avgInterval = array_sum($intervals) / count($intervals);
        $variance = 0;
        foreach ($intervals as $interval) {
            $variance += pow($interval - $avgInterval, 2);
        }
        $stdDev = sqrt($variance / count($intervals));

        $lastOrderDate = $orders->last()->created_at;
        $predictedNextDate = $lastOrderDate->copy()->addDays($avgInterval);
        $daysUntilPredicted = now()->diffInDays($predictedNextDate, false);

        // Determine confidence
        $confidence = 'UNCERTAIN';
        if ($orders->count() >= 3) {
            if ($stdDev < 3) $confidence = 'HIGH';
            elseif ($stdDev < 7) $confidence = 'MEDIUM';
            else $confidence = 'LOW';
        }

        return [
            'next_purchase' => [
                'predicted_date' => $predictedNextDate->toDateString(),
                'days_until' => round($daysUntilPredicted),
                'confidence' => $confidence,
                'avg_interval_days' => round($avgInterval, 1),
                'interval_variance' => round($stdDev, 1),
            ],
        ];
    }

    /**
     * Identify customer lifecycle stage
     *
     * @param int $customerId
     * @return array
     */
    private function identifyLifecycleStage(int $customerId): array
    {
        $user = User::findOrFail($customerId);
        $orders = Order::where('user_id', $customerId)
            ->where('status', 'completed')
            ->orderBy('created_at')
            ->get();

        $totalOrders = $orders->count();
        
        if ($totalOrders === 0) {
            return [
                'stage' => 'AWARENESS',
                'description' => 'Registered but no purchases yet',
            ];
        }

        $firstOrderDate = $orders->first()->created_at;
        $lastOrderDate = $orders->last()->created_at;
        $daysSinceFirst = $firstOrderDate->diffInDays(now());
        $daysSinceLast = $lastOrderDate->diffInDays(now());
        
        $engagementScore = $this->calculateEngagementScore($customerId);
        $isHighlyEngaged = $engagementScore['cei_score'] >= 70;

        // Determine stage
        if ($totalOrders === 1 && $daysSinceFirst <= 30) {
            $stage = 'ACQUISITION';
            $description = 'New customer - made first purchase';
        } elseif ($totalOrders >= 2 && $totalOrders <= 5 && $daysSinceFirst <= 90) {
            $stage = 'RETENTION';
            $description = 'Repeat customer - building relationship';
        } elseif ($totalOrders >= 6 && $daysSinceFirst > 90 && $isHighlyEngaged) {
            $stage = 'LOYALTY';
            $description = 'Loyal customer - high engagement';
        } elseif ($isHighlyEngaged && $totalOrders >= 10) {
            $stage = 'ADVOCACY';
            $description = 'Brand advocate - potential referrer';
        } elseif ($daysSinceLast > 60 && $daysSinceLast <= 90 && $totalOrders >= 3) {
            $stage = 'AT_RISK';
            $description = 'Was active but engagement declining';
        } elseif ($daysSinceLast > 90) {
            $stage = 'DORMANT';
            $description = 'Inactive customer - needs reactivation';
        } else {
            $stage = 'RETENTION';
            $description = 'Active customer';
        }

        return [
            'stage' => $stage,
            'description' => $description,
            'total_orders' => $totalOrders,
            'days_since_first_order' => $daysSinceFirst,
            'days_since_last_order' => $daysSinceLast,
        ];
    }

    /**
     * Get actionable recommendations based on insights
     *
     * @param int $customerId
     * @return array
     */
    private function getActionableRecommendations(int $customerId): array
    {
        $recommendations = [];
        
        // Get current insights (non-cached to avoid recursion)
        $purchaseBehavior = $this->analyzePurchaseBehavior($customerId);
        $engagementScore = $this->calculateEngagementScore($customerId);
        $lifecycleStage = $this->identifyLifecycleStage($customerId);

        // Engagement-based recommendations
        if ($engagementScore['engagement_level'] === 'DISENGAGED') {
            $recommendations[] = [
                'action' => 'WIN_BACK_CAMPAIGN',
                'priority' => 'HIGH',
                'message' => 'Send personalized win-back offer with 20% discount',
            ];
        }

        if ($engagementScore['engagement_level'] === 'LOW_ENGAGEMENT') {
            $recommendations[] = [
                'action' => 'ENGAGEMENT_BOOST',
                'priority' => 'MEDIUM',
                'message' => 'Send product recommendations and exclusive offer',
            ];
        }

        // Frequency-based recommendations
        if (isset($purchaseBehavior['frequency_tier'])) {
            if ($purchaseBehavior['frequency_tier'] === 'DAILY' || $purchaseBehavior['frequency_tier'] === 'WEEKLY') {
                $recommendations[] = [
                    'action' => 'VIP_PROGRAM',
                    'priority' => 'HIGH',
                    'message' => 'Invite to VIP/subscription program with exclusive benefits',
                ];
            }
        }

        // Lifecycle stage recommendations
        switch ($lifecycleStage['stage']) {
            case 'ACQUISITION':
                $recommendations[] = [
                    'action' => 'SECOND_PURCHASE_INCENTIVE',
                    'priority' => 'HIGH',
                    'message' => 'Send welcome series with 15% off second purchase',
                ];
                break;

            case 'AT_RISK':
                $recommendations[] = [
                    'action' => 'REENGAGEMENT',
                    'priority' => 'HIGH',
                    'message' => 'Send "We miss you" campaign with personalized offers',
                ];
                break;

            case 'DORMANT':
                $recommendations[] = [
                    'action' => 'REACTIVATION',
                    'priority' => 'CRITICAL',
                    'message' => 'Launch win-back campaign with major incentive and survey',
                ];
                break;

            case 'LOYALTY':
                $recommendations[] = [
                    'action' => 'LOYALTY_REWARD',
                    'priority' => 'MEDIUM',
                    'message' => 'Provide exclusive perks and early access to new products',
                ];
                break;
        }

        return $recommendations;
    }

    /**
     * Determine frequency tier
     *
     * @param float $ordersPerMonth
     * @return string
     */
    private function determineFrequencyTier(float $ordersPerMonth): string
    {
        if ($ordersPerMonth >= 20) return 'DAILY';
        if ($ordersPerMonth >= 8) return 'WEEKLY';
        if ($ordersPerMonth >= 4) return 'BI_WEEKLY';
        if ($ordersPerMonth >= 2) return 'MONTHLY';
        if ($ordersPerMonth >= 1) return 'OCCASIONAL';
        return 'RARE';
    }

    /**
     * Determine spending tier
     *
     * @param float $avgOrderValue
     * @return string
     */
    private function determineSpendingTier(float $avgOrderValue): string
    {
        if ($avgOrderValue > 50) return 'PREMIUM';
        if ($avgOrderValue >= 20) return 'STANDARD';
        if ($avgOrderValue >= 10) return 'BUDGET';
        return 'MINIMAL';
    }

    /**
     * Analyze spending trend
     *
     * @param \Illuminate\Support\Collection $orders
     * @return string
     */
    private function analyzeSpendingTrend($orders): string
    {
        if ($orders->count() < 4) {
            return 'INSUFFICIENT_DATA';
        }

        // Compare recent vs older orders
        $recentOrders = $orders->slice(-3);
        $olderOrders = $orders->take(3);

        $recentAvg = $recentOrders->avg('total_amount');
        $olderAvg = $olderOrders->avg('total_amount');

        $percentChange = (($recentAvg - $olderAvg) / $olderAvg) * 100;

        if ($percentChange > 10) return 'INCREASING';
        if ($percentChange < -10) return 'DECREASING';
        return 'STABLE';
    }

    /**
     * Analyze time patterns
     *
     * @param \Illuminate\Support\Collection $orders
     * @return array
     */
    private function analyzeTimePatterns($orders): array
    {
        $hourCounts = array_fill(0, 24, 0);
        $dayCounts = array_fill(0, 7, 0);
        
        foreach ($orders as $order) {
            $hourCounts[$order->created_at->hour]++;
            $dayCounts[$order->created_at->dayOfWeek]++;
        }
        
        // Determine time preference
        $morningOrders = array_sum(array_slice($hourCounts, 6, 5));
        $afternoonOrders = array_sum(array_slice($hourCounts, 12, 5));
        $eveningOrders = array_sum(array_slice($hourCounts, 17, 4));
        $totalOrders = array_sum($hourCounts);
        
        $timePreference = 'FLEXIBLE';
        if ($totalOrders > 0) {
            if ($morningOrders / $totalOrders > 0.6) $timePreference = 'MORNING_PERSON';
            elseif ($afternoonOrders / $totalOrders > 0.6) $timePreference = 'AFTERNOON_REGULAR';
            elseif ($eveningOrders / $totalOrders > 0.6) $timePreference = 'EVENING_VISITOR';
        }
        
        // Determine day preference
        $weekdayOrders = array_sum(array_slice($dayCounts, 1, 5));
        $weekendOrders = $dayCounts[0] + $dayCounts[6];
        
        $dayPreference = 'CONSISTENT';
        if ($totalOrders > 0) {
            if ($weekdayOrders / $totalOrders > 0.7) $dayPreference = 'WEEKDAY_CUSTOMER';
            elseif ($weekendOrders / $totalOrders > 0.6) $dayPreference = 'WEEKEND_WARRIOR';
        }
        
        return [
            'time_preference' => $timePreference,
            'day_preference' => $dayPreference,
        ];
    }

    /**
     * Determine engagement level
     *
     * @param float $cei
     * @return string
     */
    private function determineEngagementLevel(float $cei): string
    {
        if ($cei >= 90) return 'HIGHLY_ENGAGED';
        if ($cei >= 70) return 'ENGAGED';
        if ($cei >= 50) return 'MODERATELY_ENGAGED';
        if ($cei >= 30) return 'LOW_ENGAGEMENT';
        return 'DISENGAGED';
    }

    /**
     * Clear customer insights cache
     *
     * @param int $customerId
     * @return void
     */
    public function clearCustomerInsightsCache(int $customerId): void
    {
        Cache::forget("customer_insights_{$customerId}");
    }
}
