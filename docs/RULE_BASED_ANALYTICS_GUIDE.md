# Rule-Based Analytics & Recommendation System
## Arbiter Coffee Shop - No Machine Learning Required

This document outlines the comprehensive rule-based analytics and recommendation system implemented in the Arbiter Coffee Shop application. **No Python or Machine Learning libraries are required** - everything is built using PHP/Laravel with pure statistical and rule-based logic.

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Customer Analytics](#customer-analytics)
3. [Customer Insights](#customer-insights)
4. [Product Recommendations](#product-recommendations)
5. [Inventory Forecasting](#inventory-forecasting)
6. [Performance Analytics](#performance-analytics)
7. [Implementation Guide](#implementation-guide)

---

## System Overview

### Architecture
- **Language**: PHP 8.x / Laravel 11
- **Database**: MySQL
- **Caching**: Laravel Cache (Redis/Memcached recommended)
- **Approach**: Statistical algorithms + Business rules
- **No Dependencies On**: Python, TensorFlow, PyTorch, scikit-learn, or any ML libraries

### Key Principles
1. **Statistical Methods**: Simple averages, weighted averages, linear regression
2. **Business Rules**: Domain-specific logic based on coffee shop operations
3. **Pattern Recognition**: Collaborative and content-based filtering
4. **Time-Series Analysis**: Trend detection using basic statistical methods

---

## Customer Analytics

### 1. Customer Segmentation

**Algorithm**: Rule-Based Clustering

```php
Segments:
- NEW: Account age ≤ 30 days
- LOYAL: Orders ≥ 20 AND Total spent ≥ $5000
- FREQUENT: Orders ≥ 10
- OCCASIONAL: Orders < 10
- AT_RISK: Last order > 60 days ago
- DORMANT: Last order > 90 days ago OR no orders
```

**Implementation**: `AnalyticsController::getCustomerSegments()`

**Business Value**:
- Targeted marketing campaigns
- Retention strategies
- Personalized communications

### 2. Customer Lifetime Value (CLV)

**Formula**:
```
CLV = Total Revenue from Customer / Customer Tenure (months)
Average CLV = Total Revenue / Total Customers
```

**Implementation**: Built into customer insights

**Use Cases**:
- Identify high-value customers
- Budget allocation for customer acquisition
- VIP program eligibility

### 3. Churn Prediction

**Algorithm**: Time-Based Rules

```php
Churn Risk Levels:
- HIGH: No orders in last 90+ days
- MEDIUM: No orders in last 60-89 days
- LOW: No orders in last 30-59 days
- ACTIVE: Recent orders within 30 days
```

**Triggers**:
- Automated re-engagement emails
- Special discount offers
- Personalized recommendations

---

## Customer Insights

### Overview
Customer Insights uses rule-based analysis to understand customer behavior, preferences, and patterns. This helps in personalized marketing, inventory planning, and improving customer experience.

### 1. Purchase Behavior Analysis

#### Frequency Segmentation

**Algorithm**: Order Frequency Classification

```php
Purchase Frequency Tiers:
- DAILY:        Orders ≥ 20 per month (avg 5+ per week)
- WEEKLY:       Orders 8-19 per month (avg 2-4 per week)
- BI_WEEKLY:    Orders 4-7 per month (avg 1-2 per week)
- MONTHLY:      Orders 2-3 per month
- OCCASIONAL:   Orders 1 per month
- RARE:         Orders < 1 per month
```

**Business Actions**:
```php
DAILY → VIP treatment, subscription offers, exclusive previews
WEEKLY → Loyalty rewards, birthday perks, referral bonuses
BI_WEEKLY → Regular promotions, feedback requests
MONTHLY → Engagement campaigns, new product notifications
OCCASIONAL → Reactivation emails, special discounts
RARE → Win-back campaigns, survey invitations
```

#### Order Value Patterns

**Algorithm**: Spending Behavior Classification

```php
Average Order Value (AOV) = Total Revenue / Total Orders

Spending Tiers:
- PREMIUM:     AOV > $50 (high-value customer)
- STANDARD:    AOV $20-$50 (typical customer)
- BUDGET:      AOV $10-$19 (price-conscious)
- MINIMAL:     AOV < $10 (entry-level)

Trend Analysis:
- INCREASING:  AOV trending up >10% over 3 months
- STABLE:      AOV variance <10%
- DECREASING:  AOV trending down >10%
```

**Insights Generated**:
```php
Premium + Increasing → Upsell opportunities (specialty items, premium beans)
Premium + Decreasing → Risk of churn, needs attention
Standard + Stable → Core customer base, maintain satisfaction
Budget + Increasing → Growth potential, nurture with mid-tier offers
```

#### Purchase Time Patterns

**Algorithm**: Temporal Behavior Analysis

```php
Time Preferences:
MORNING_PERSON:    >60% orders between 6-11 AM
AFTERNOON_REGULAR: >60% orders between 12-5 PM
EVENING_VISITOR:   >60% orders between 5-9 PM
NIGHT_OWL:         >60% orders between 9 PM-6 AM

Day Preferences:
WEEKDAY_CUSTOMER:  >70% orders Mon-Fri
WEEKEND_WARRIOR:   >60% orders Sat-Sun
CONSISTENT:        Evenly distributed

Visit Regularity:
ROUTINE:           Orders on same days/times (variance <2 hours)
FLEXIBLE:          No clear pattern
SPONTANEOUS:       Irregular, unpredictable visits
```

**Marketing Applications**:
```php
MORNING_PERSON → Send promotions at 7 AM, highlight breakfast items
WEEKEND_WARRIOR → Friday evening promos for weekend specials
ROUTINE → Predict next visit, prepare favorites, send timely reminders
```

### 2. Product Affinity Analysis

#### Favorite Categories

**Algorithm**: Category Preference Scoring

```php
For each customer:
    For each category:
        Order_Count = number of orders containing category items
        Total_Spent = sum of spending in category
        Recency = days since last purchase in category
        
        Category_Score = (Order_Count × 0.4) + 
                        (Total_Spent / 10 × 0.4) + 
                        (max(0, 100 - Recency) / 100 × 0.2)

Rank categories by score → Top 3 = Favorite Categories
```

**Example Output**:
```json
{
    "customer_id": 123,
    "favorite_categories": [
        {
            "category": "Coffee Beans",
            "score": 87.5,
            "order_count": 15,
            "total_spent": 450.00,
            "last_purchase": "2 days ago"
        },
        {
            "category": "Pastries",
            "score": 62.3,
            "order_count": 8,
            "total_spent": 120.00,
            "last_purchase": "1 week ago"
        }
    ]
}
```

#### Product Combinations (Basket Analysis)

**Algorithm**: Frequently Bought Together

```php
For each customer:
    Extract all orders with 2+ items
    Identify product pairs that appear together
    Calculate co-occurrence frequency
    
    Combination_Strength = (times_bought_together / total_orders) × 100

Common Patterns:
- Coffee + Pastry (65% of orders)
- Espresso + Croissant (45%)
- Cold Brew + Sandwich (38%)
- Latte + Muffin (52%)
```

**Use Cases**:
- Bundle promotions
- Cross-sell recommendations
- Menu pairing suggestions
- Inventory planning (stock complementary items)

#### Taste Profile Discovery

**Algorithm**: Flavor Preference Extraction

```php
For coffee bean purchases:
    Extract tasting_notes from product descriptions
    Count frequency of flavor descriptors
    
    Flavor Preferences = Top 5 most common descriptors

Examples:
- "Chocolaty, Nutty, Medium Body" → TRADITIONAL profile
- "Fruity, Bright, Floral" → ADVENTUROUS profile
- "Smooth, Mild, Low Acidity" → GENTLE profile
- "Bold, Rich, Dark Roast" → INTENSE profile

Roast Preferences:
    Light_Roast_Count, Medium_Roast_Count, Dark_Roast_Count
    Favorite = max(counts)
```

**Personalization**:
```php
TRADITIONAL → Recommend classic blends, Colombian, Brazilian beans
ADVENTUROUS → Recommend Ethiopian, Kenyan, experimental roasts
GENTLE → Recommend low-acid blends, decaf options
INTENSE → Recommend Italian roast, espresso blends
```

### 3. Engagement Scoring

#### Customer Engagement Index (CEI)

**Algorithm**: Multi-Factor Engagement Score

```php
CEI Components:
1. Purchase Frequency (30%)
   Score = (orders_last_90_days / 90) × 100
   
2. Monetary Value (25%)
   Score = (total_spent_last_90_days / avg_customer_spent) × 100
   
3. Recency (20%)
   Score = max(0, 100 - days_since_last_order)
   
4. Product Diversity (15%)
   Score = (unique_products_purchased / total_products_available) × 100
   
5. Interaction Level (10%)
   Score = (app_opens + email_clicks + reviews_written) normalized to 100

CEI = Σ(Component_Score × Weight)

Engagement Levels:
90-100: HIGHLY ENGAGED (brand advocates)
70-89:  ENGAGED (regular customers)
50-69:  MODERATELY ENGAGED (potential growth)
30-49:  LOW ENGAGEMENT (at risk)
0-29:   DISENGAGED (win-back needed)
```

**Example Calculation**:
```php
Customer: Jane Doe
- Orders (90 days): 12 orders → (12/90)×100 = 13.3 → 13.3 × 0.30 = 4.0
- Spent: $450 (avg: $300) → (450/300)×100 = 150 → capped at 100 × 0.25 = 25.0
- Recency: 3 days → 100-3 = 97 × 0.20 = 19.4
- Diversity: 8 products (of 50) → (8/50)×100 = 16 × 0.15 = 2.4
- Interactions: 20 actions → normalized = 80 × 0.10 = 8.0

CEI = 4.0 + 25.0 + 19.4 + 2.4 + 8.0 = 58.8 (MODERATELY ENGAGED)
```

#### Satisfaction Indicators

**Algorithm**: Implicit Satisfaction Scoring

```php
Positive Signals (+):
+ Repeat purchases of same product (+10 points each)
+ Increasing order frequency (+5 points)
+ Higher AOV over time (+5 points)
+ Writing reviews (+15 points)
+ Referrals (+20 points)
+ Loyalty program participation (+10 points)

Negative Signals (-):
- Returns/refunds (-20 points)
- Complaints (-25 points)
- Decreasing frequency (-10 points)
- Long gaps between orders (-5 points)
- Abandoned carts (-5 points)

Satisfaction_Score = Σ(Positive Signals) - Σ(Negative Signals)

Ranges:
80+:    DELIGHTED (promoters)
50-79:  SATISFIED (loyal customers)
20-49:  NEUTRAL (passive)
0-19:   DISSATISFIED (detractors)
<0:     UNHAPPY (crisis intervention needed)
```

### 4. Cohort Analysis

#### New Customer Cohorts

**Algorithm**: Cohort Performance Tracking

```php
Cohort Definition: Customers who made first purchase in same month

Metrics per Cohort:
- Month 0: First purchase (100% by definition)
- Month 1: % who made 2nd purchase (retention)
- Month 2: % who made 3rd purchase
- Month 3: % still active
- Month 6: % still active
- Month 12: % still active

Cohort Quality:
EXCELLENT:  Month 3 retention >70%
GOOD:       Month 3 retention 50-69%
AVERAGE:    Month 3 retention 30-49%
POOR:       Month 3 retention <30%
```

**Example Output**:
```
January 2025 Cohort (50 customers):
Month 0: 50 customers (100%)
Month 1: 38 customers (76%) - purchased again
Month 2: 32 customers (64%) - still active
Month 3: 28 customers (56%) - GOOD retention

Marketing Spend Efficiency:
Revenue per customer: $185
Acquisition cost: $25
ROI: 640%
```

### 5. Predictive Insights

#### Next Purchase Prediction

**Algorithm**: Pattern-Based Prediction

```php
Calculate purchase cycle:
    orders = get_customer_orders(customer_id)
    intervals = calculate_days_between_orders(orders)
    avg_interval = average(intervals)
    
    last_order_date = orders.last.created_at
    predicted_next = last_order_date + avg_interval days
    
    confidence = 1 / standard_deviation(intervals)

Prediction Quality:
HIGH:      Intervals variance <3 days (very regular)
MEDIUM:    Intervals variance 3-7 days (somewhat regular)
LOW:       Intervals variance >7 days (irregular)
UNCERTAIN: <3 orders (insufficient data)
```

**Use Cases**:
```php
2 days before predicted purchase → Send reminder with favorites
On predicted day → "We noticed you usually order on Tuesdays!"
1 day after predicted (no purchase) → "Miss us? Here's 10% off"
```

#### Product Recommendation Triggers

**Algorithm**: Context-Based Triggers

```php
Trigger Scenarios:

1. Depletion Prediction (for consumables like coffee beans)
   Purchase_Date + (Package_Size / Daily_Consumption_Estimate)
   → Send reorder reminder 3 days before depletion

2. Complementary Product Trigger
   Bought Coffee Beans → Suggest filters, grinder, storage container
   Bought Espresso Machine → Suggest cleaning kit, descaler

3. Upgrade Trigger
   Purchasing entry-level products for 3+ months
   → Suggest premium alternatives with comparison

4. Discovery Trigger
   Stuck in same category for 5+ orders
   → "Try something new" campaign with variety pack

5. Seasonal Trigger
   Summer approaching + no cold brew purchases
   → Highlight iced drinks and cold brew options
```

### 6. Customer Journey Mapping

#### Lifecycle Stage Identification

**Algorithm**: Journey Stage Classification

```php
Stage Rules:

AWARENESS:
- First visit/registration
- No purchases yet
- Browsing behavior only

CONSIDERATION:
- Added items to cart
- Viewed product details 3+ times
- No purchase yet

ACQUISITION:
- Made first purchase
- 0-30 days since first order

RETENTION:
- 2-5 total purchases
- 31-90 days as customer
- Regular engagement

LOYALTY:
- 6+ purchases
- 90+ days as customer
- High engagement score

ADVOCACY:
- Referred other customers
- Written reviews
- Active on social media
- VIP/loyalty program member

AT_RISK:
- Was loyal but engagement dropped
- Recency >60 days
- Decreasing order frequency

DORMANT:
- No activity >90 days
- Was a customer before
```

**Stage-Specific Actions**:
```php
AWARENESS → Educational content, first-time discount
CONSIDERATION → Product comparisons, reviews, limited-time offer
ACQUISITION → Welcome email, onboarding guide, 2nd purchase incentive
RETENTION → Loyalty points, personalized recommendations
LOYALTY → Exclusive access, VIP events, insider previews
ADVOCACY → Referral rewards, community features, early access
AT_RISK → Win-back campaign, "We miss you" discount
DORMANT → Reactivation series, survey, major incentive
```

#### Drop-off Point Analysis

**Algorithm**: Identify Where Customers Leave

```php
Funnel Stages:
1. Homepage Visit
2. Product Browse
3. Product Detail View
4. Add to Cart
5. Checkout Initiated
6. Payment Info Entered
7. Order Completed

For each stage:
    drop_off_rate = (users_current_stage - users_next_stage) / users_current_stage × 100

High Drop-off Triggers Investigation:
>30% drop-off at cart → Pricing concerns, unexpected costs
>20% drop-off at checkout → Payment issues, complex process
>40% drop-off at product view → Poor descriptions, missing info
```

### 7. Implementation Example

```php
// CustomerInsightsService.php

namespace App\Services;

use App\Models\User;
use App\Models\Order;
use App\Models\OrderItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CustomerInsightsService
{
    /**
     * Generate comprehensive customer insights
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
        
        // Time patterns
        $timePattern = $this->analyzeTimePatterns($orders);
        
        // Order intervals
        $intervals = [];
        for ($i = 1; $i < $totalOrders; $i++) {
            $intervals[] = $orders[$i]->created_at->diffInDays($orders[$i-1]->created_at);
        }
        $avgInterval = count($intervals) > 0 ? array_sum($intervals) / count($intervals) : null;
        
        return [
            'total_orders' => $totalOrders,
            'total_spent' => $totalSpent,
            'avg_order_value' => round($avgOrderValue, 2),
            'frequency_tier' => $frequencyTier,
            'spending_tier' => $spendingTier,
            'time_pattern' => $timePattern,
            'avg_days_between_orders' => $avgInterval ? round($avgInterval, 1) : null,
            'first_order_date' => $orders->first()->created_at->toDateString(),
            'last_order_date' => $orders->last()->created_at->toDateString(),
        ];
    }

    /**
     * Calculate Customer Engagement Index
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
        $totalProducts = DB::table('products')->where('is_available', true)->count();
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
     * Determine frequency tier
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
     */
    private function determineSpendingTier(float $avgOrderValue): string
    {
        if ($avgOrderValue > 50) return 'PREMIUM';
        if ($avgOrderValue >= 20) return 'STANDARD';
        if ($avgOrderValue >= 10) return 'BUDGET';
        return 'MINIMAL';
    }

    /**
     * Analyze time patterns
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
        if ($morningOrders / $totalOrders > 0.6) $timePreference = 'MORNING_PERSON';
        elseif ($afternoonOrders / $totalOrders > 0.6) $timePreference = 'AFTERNOON_REGULAR';
        elseif ($eveningOrders / $totalOrders > 0.6) $timePreference = 'EVENING_VISITOR';
        
        // Determine day preference
        $weekdayOrders = array_sum(array_slice($dayCounts, 1, 5));
        $weekendOrders = $dayCounts[0] + $dayCounts[6];
        
        $dayPreference = 'CONSISTENT';
        if ($weekdayOrders / $totalOrders > 0.7) $dayPreference = 'WEEKDAY_CUSTOMER';
        elseif ($weekendOrders / $totalOrders > 0.6) $dayPreference = 'WEEKEND_WARRIOR';
        
        return [
            'time_preference' => $timePreference,
            'day_preference' => $dayPreference,
        ];
    }

    /**
     * Determine engagement level
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
     * Get actionable recommendations based on insights
     */
    private function getActionableRecommendations(int $customerId): array
    {
        $insights = $this->generateCustomerInsights($customerId);
        $recommendations = [];
        
        // Add recommendations based on various factors
        if ($insights['engagement_score']['engagement_level'] === 'DISENGAGED') {
            $recommendations[] = [
                'action' => 'WIN_BACK_CAMPAIGN',
                'priority' => 'HIGH',
                'message' => 'Send personalized win-back offer',
            ];
        }
        
        if ($insights['purchase_behavior']['frequency_tier'] === 'DAILY') {
            $recommendations[] = [
                'action' => 'VIP_PROGRAM',
                'priority' => 'HIGH',
                'message' => 'Invite to VIP/subscription program',
            ];
        }
        
        // More recommendations based on other factors...
        
        return $recommendations;
    }
}
```

### 8. Dashboard Integration

**Customer Insights Dashboard Components**:

```javascript
// React Component Example
function CustomerInsightsDashboard({ customerId }) {
    const [insights, setInsights] = useState(null);
    
    useEffect(() => {
        fetchCustomerInsights(customerId);
    }, [customerId]);
    
    return (
        <div className="insights-dashboard">
            <EngagementScoreCard cei={insights?.engagement_score} />
            <PurchaseBehaviorCard behavior={insights?.purchase_behavior} />
            <ProductAffinityCard affinity={insights?.product_affinity} />
            <PredictionsCard predictions={insights?.predictions} />
            <RecommendationsCard recommendations={insights?.recommendations} />
        </div>
    );
}
```

---

## Product Recommendations

### Service: `RecommendationService.php`

### 1. Collaborative Filtering

**Algorithm**: "Customers who bought X also bought Y"

```
Step 1: Find products customer has purchased
Step 2: Find other customers who bought similar products
Step 3: Identify products those customers bought
Step 4: Filter out products current customer already owns
Step 5: Rank by purchase frequency
```

**Weight**: 40% of final recommendation score

**Example**:
```php
Customer A bought: Espresso, Latte, Croissant
Similar customers bought: Cappuccino (15 times), Muffin (12 times)
Recommendation: Cappuccino (not yet purchased by Customer A)
```

### 2. Content-Based Filtering

**Algorithm**: Similarity by Category and Attributes

```
Step 1: Identify customer's favorite categories (by purchase frequency)
Step 2: Find products in those categories
Step 3: Exclude already-purchased products
Step 4: Rank by category preference strength
```

**Weight**: 30% of final recommendation score

**Matching Criteria**:
- Product category
- Price range
- Product tags/attributes
- Taste profile (for coffee beans)

### 3. Popularity-Based Recommendations

**Algorithm**: Trending Products (Last 30 Days)

```sql
SELECT products.*, 
       COUNT(order_items.id) as order_count,
       SUM(order_items.quantity) as total_sold
FROM products
JOIN order_items ON products.id = order_items.product_id
JOIN orders ON order_items.order_id = orders.id
WHERE orders.created_at >= NOW() - INTERVAL 30 DAY
  AND orders.status = 'completed'
GROUP BY products.id
ORDER BY order_count DESC
```

**Weight**: 20% of final recommendation score

### 4. Time-Based Recommendations

**Algorithm**: Context-Aware Rules

```php
Morning (6 AM - 11 AM):
  -> Breakfast items, Espresso, Latte, Croissants

Afternoon (2 PM - 5 PM):
  -> Snacks, Iced drinks, Cold brew, Pastries

Evening (5 PM - 9 PM):
  -> Desserts, Decaf, Tea

Weekend vs Weekday:
  -> Weekend: Brunch items, Specialty drinks
  -> Weekday: Quick items, To-go orders
```

**Weight**: 10% of final recommendation score

### 5. Coffee Bean Recommendations

**Specialized Algorithm for Coffee Enthusiasts**

```php
Scoring System:
+ 20 points: Matches roast preference (from taste profile)
+ 10 points: Matches flavor preferences
+ 15 points: New origin (not previously tried)
+ 25 points: Featured selection
+  5 points: High elevation (>1500m - quality indicator)
```

**Taste Profile Matching**:
- Favorite roast (light, medium, dark)
- Flavor notes (fruity, chocolaty, nutty, floral)
- Brewing methods
- Intensity preference

---

## Inventory Forecasting

### Service: `AnalyticsController::generateInventoryForecast()`

### Methods Available:

#### 1. Simple Average
```
Daily consumption = Average of last 60 days
Forecast = Current stock - (Daily consumption × Days)
```

**Best for**: Stable, consistent consumption patterns

#### 2. Weighted Average
```
Recent days weighted higher than older days
Weight[day] = position_in_sequence / total_days
Weighted consumption = Σ(consumption × weight) / Σ(weights)
```

**Best for**: Gradually changing consumption patterns

#### 3. Linear Regression
```
Trend line: y = mx + b
Where:
  m = slope (rate of change)
  b = intercept
  x = day number
  y = predicted consumption

Calculation:
  slope = (n×Σxy - Σx×Σy) / (n×Σx² - (Σx)²)
  intercept = (Σy - slope×Σx) / n
```

**Best for**: Clear upward or downward trends

### Reorder Recommendations

**Algorithm**:
```php
if (predicted_stock <= reorder_level) {
    alert = "Reorder needed in {days} days"
    recommended_quantity = daily_consumption × 30 // 30-day supply
}

if (predicted_stock <= 0) {
    alert = "CRITICAL: Stockout risk in {days} days"
    recommended_quantity = daily_consumption × 45 // 45-day supply
}
```

**Outputs**:
- Days until reorder needed
- Days until stockout
- Recommended order quantity
- Cost estimate

---

## Performance Analytics

### 1. Barista Performance Scoring

**Metrics Tracked**:
- Speed score (order completion time)
- Quality score (customer feedback, order accuracy)
- Attendance score (presence rate)
- Teamwork score (collaboration metrics)
- Customer service score (ratings, complaints)

**Overall Score Formula**:
```
Overall = (Speed + Quality + Attendance + Teamwork + Service) / 5
```

**Performance Grades**:
```php
A+ (9.5-10.0): Outstanding
A  (9.0-9.4):  Excellent
B+ (8.5-8.9):  Very Good
B  (8.0-8.4):  Good
C+ (7.0-7.9):  Satisfactory
C  (6.0-6.9):  Needs Improvement
D  (<6.0):     Below Standard
```

### 2. Attendance Analytics

**Metrics**:
- Attendance rate = (Present days / Total scheduled days) × 100
- Late arrivals frequency
- Absence patterns
- Shift completion rate

### 3. Order Completion Analytics

**Key Performance Indicators (KPIs)**:
```
Average prep time = Σ(completion_time - order_time) / total_orders
Rush hour performance = completions_during_peak / total_peak_orders
Order accuracy = (correct_orders / total_orders) × 100
```

---

## Implementation Guide

### Step 1: Install Recommendation Service

The `RecommendationService.php` file has been created. Register it in your Laravel service provider:

```php
// app/Providers/AppServiceProvider.php

use App\Services\RecommendationService;

public function register()
{
    $this->app->singleton(RecommendationService::class, function ($app) {
        return new RecommendationService();
    });
}
```

### Step 2: Create Controller Endpoints

```php
// app/Http/Controllers/Api/RecommendationController.php

namespace App\Http\Controllers\Api;

use App\Services\RecommendationService;
use Illuminate\Http\Request;

class RecommendationController extends BaseController
{
    protected $recommendationService;

    public function __construct(RecommendationService $recommendationService)
    {
        $this->recommendationService = $recommendationService;
    }

    public function getProductRecommendations(Request $request)
    {
        $customerId = $request->user()->id;
        $limit = $request->get('limit', 5);
        
        $recommendations = $this->recommendationService
            ->getProductRecommendations($customerId, $limit);
        
        return $this->sendResponse($recommendations, 'Recommendations retrieved successfully');
    }

    public function getCoffeeBeanRecommendations(Request $request)
    {
        $customerId = $request->user()->id;
        $limit = $request->get('limit', 5);
        
        $recommendations = $this->recommendationService
            ->getCoffeeBeanRecommendations($customerId, $limit);
        
        return $this->sendResponse($recommendations, 'Coffee bean recommendations retrieved successfully');
    }
}
```

### Step 3: Add Routes

```php
// routes/api.php

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/recommendations/products', [RecommendationController::class, 'getProductRecommendations']);
    Route::get('/recommendations/coffee-beans', [RecommendationController::class, 'getCoffeeBeanRecommendations']);
});
```

### Step 4: Frontend Integration

```javascript
// Example React component

import { useEffect, useState } from 'react';
import apiService from '../services/api.service';

function ProductRecommendations() {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const response = await apiService.get('/recommendations/products');
        if (response.success) {
          setRecommendations(response.data);
        }
      } catch (error) {
        console.error('Failed to load recommendations:', error);
      }
    }
    
    fetchRecommendations();
  }, []);

  return (
    <div className="recommendations">
      <h3>Recommended For You</h3>
      {recommendations.map((rec, index) => (
        <div key={index} className="recommendation-card">
          <h4>{rec.product.name}</h4>
          <p>{rec.reasons.join(', ')}</p>
          <span className="score">Match: {rec.score}%</span>
        </div>
      ))}
    </div>
  );
}
```

### Step 5: Schedule Periodic Cache Refresh

```php
// app/Console/Kernel.php

protected function schedule(Schedule $schedule)
{
    // Refresh recommendations daily at 2 AM
    $schedule->call(function () {
        $customers = User::role('customer')->pluck('id');
        $service = app(RecommendationService::class);
        
        foreach ($customers as $customerId) {
            $service->clearCustomerRecommendationCache($customerId);
        }
    })->daily()->at('02:00');
}
```

---

## Performance Optimization

### 1. Caching Strategy

```php
// Cache recommendations for 1 hour
Cache::remember("recommendations_{$customerId}", 3600, function() {
    return $this->generateRecommendations($customerId);
});

// Clear cache after relevant actions
// - New order placed
// - Taste profile updated
// - Product preferences changed
```

### 2. Query Optimization

- Use indexes on frequently queried columns:
  - `orders.user_id`
  - `order_items.product_id`
  - `orders.created_at`
  - `products.category_id`

- Use eager loading to prevent N+1 queries:
```php
$customers = User::with(['orders', 'tasteProfile'])->get();
```

### 3. Background Processing

For computationally expensive operations:

```php
// Queue recommendation pre-generation
dispatch(new GenerateRecommendationsJob($customerId));
```

---

## Advantages Over Machine Learning

### 1. **Simplicity**
- No complex model training
- No Python/ML library dependencies
- Easier to debug and maintain

### 2. **Transparency**
- Rules are explicit and understandable
- Easy to explain to stakeholders
- Customer-facing explanations ("Because you bought X...")

### 3. **Real-Time Updates**
- Recommendations update immediately after purchase
- No retraining required
- Instant adaptation to new products

### 4. **Lower Infrastructure Costs**
- No GPU requirements
- No ML model hosting
- Standard web server sufficient

### 5. **Data Efficiency**
- Works with small datasets
- No minimum data requirements for training
- Graceful degradation with limited data

### 6. **Regulatory Compliance**
- No "black box" algorithms
- GDPR-friendly (explainable decisions)
- Easy to audit

---

## Monitoring & Evaluation

### Key Metrics to Track

```php
Recommendation Effectiveness:
- Click-through rate (CTR)
- Conversion rate
- Average order value of recommended items
- Recommendation acceptance rate

Customer Engagement:
- Time spent viewing recommendations
- Products added to cart from recommendations
- Repeat purchase rate

Business Impact:
- Revenue from recommended products
- Cross-sell success rate
- Customer satisfaction scores
```

### A/B Testing Framework

```php
// Simple A/B test implementation
if ($customerId % 2 === 0) {
    // Group A: Collaborative filtering weight increased
    $weights = ['collaborative' => 0.5, 'content' => 0.3, ...];
} else {
    // Group B: Content-based weight increased
    $weights = ['collaborative' => 0.3, 'content' => 0.5, ...];
}

// Track which group performs better
```

---

## Future Enhancements

### 1. Enhanced Taste Profiles
- Flavor wheel integration
- Aroma preferences
- Texture preferences
- Temperature preferences

### 2. Social Recommendations
- "Your friends also like..."
- Community favorites
- Local trends

### 3. Seasonal Adjustments
- Holiday specials
- Weather-based recommendations
- Cultural events

### 4. Advanced Inventory Forecasting
- Exponential smoothing
- Moving average convergence/divergence (MACD)
- Seasonal decomposition

### 5. Personalized Pricing
- Loyalty discounts
- Bundle recommendations
- Volume-based pricing

---

## Conclusion

This rule-based system provides comprehensive analytics and recommendation capabilities **without requiring Python or Machine Learning**. It's:

- ✅ Production-ready
- ✅ Scalable
- ✅ Maintainable
- ✅ Explainable
- ✅ Cost-effective
- ✅ Fast and responsive

The system leverages proven statistical methods, business domain knowledge, and smart caching to deliver relevant, accurate recommendations that improve customer experience and drive business growth.

---

## Support & Documentation

For questions or contributions:
- Backend: `app/Services/RecommendationService.php`
- Analytics: `app/Http/Controllers/Api/AnalyticsController.php`
- Tests: `tests/Feature/RecommendationTest.php` (create as needed)

---

**Last Updated**: December 10, 2025
**Version**: 1.0.0
**Maintained by**: Arbiter Coffee Shop Development Team
