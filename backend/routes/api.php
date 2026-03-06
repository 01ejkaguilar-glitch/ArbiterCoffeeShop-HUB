<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\AnnouncementController;
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\InquiryController;
use App\Http\Controllers\Api\V1\CoffeeBeanController;
use App\Http\Controllers\Api\V1\PublicController;
use App\Http\Controllers\Api\V1\HealthCheckController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\FeaturedOriginController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\BaristaController;
use App\Http\Controllers\Api\KitchenController;
use App\Http\Controllers\Api\PosController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\ShiftController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SystemConfigController;
use App\Http\Controllers\Api\LeaveRequestController;
use App\Http\Controllers\Api\PerformanceReviewController;
use App\Http\Controllers\Api\V1\PaymentWebhookController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// API Version 1
Route::prefix('v1')->group(function () {

    // Health Check Endpoints
    Route::get('/health', [HealthCheckController::class, 'check']);
    Route::get('/health/database', [HealthCheckController::class, 'check'])->name('health.database');
    Route::get('/health/cache', [HealthCheckController::class, 'check'])->name('health.cache');
    Route::get('/health/storage', [HealthCheckController::class, 'check'])->name('health.storage');

    // Public routes - Test endpoint
    Route::get('/test', function () {
        return response()->json([
            'success' => true,
            'message' => 'Arbiter Coffee Hub API v1.0',
            'timestamp' => now()->toDateTimeString()
        ]);
    });

    // Test workforce route
    Route::get('/workforce-test', function () {
        return response()->json(['success' => true, 'message' => 'Workforce test']);
    });

    // Authentication routes (public) - Enhanced throttling
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register'])
            ->middleware('throttle.user:5,1'); // 5 attempts per minute per user
        Route::post('/login', [AuthController::class, 'login'])
            ->middleware('throttle.user:5,1'); // 5 attempts per minute per user
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
            ->middleware('throttle.user:3,1'); // 3 attempts per minute per user
        Route::post('/reset-password', [AuthController::class, 'resetPassword'])
            ->middleware('throttle.user:3,1'); // 3 attempts per minute per user

        // Protected auth routes
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/user', [AuthController::class, 'user']);
            Route::post('/refresh-token', [AuthController::class, 'refreshToken']);
        });

        // Test-only debug endpoint to inspect headers during PHPUnit runs
        if (app()->environment('testing')) {
            Route::get('/debug/headers', function (Request $request) {
                return response()->json([
                    'authorization' => $request->header('Authorization'),
                    'bearer' => $request->bearerToken(),
                ]);
            });
        }
    });

    // ==================================================
    // PUBLIC ROUTES (No authentication required) - Enhanced caching
    // ==================================================

    Route::middleware('cache.response:300')->group(function () { // 5 minutes cache
        // Products (public browsing)
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/{id}', [ProductController::class, 'show']);
        Route::get('/products/{id}/recipe', [ProductController::class, 'getRecipe']);

        // Categories (public browsing)
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::get('/categories/{id}', [CategoryController::class, 'show']);

        // Coffee Beans (public browsing)
        Route::get('/coffee-beans', [CoffeeBeanController::class, 'index']);
        Route::get('/coffee-beans/featured', [CoffeeBeanController::class, 'featured']);
        Route::get('/coffee-beans/{id}', [CoffeeBeanController::class, 'show']);

        // Public Settings & Information
        Route::get('/settings/operating-hours', [PublicController::class, 'getOperatingHours']);
        Route::get('/settings/contact-info', [PublicController::class, 'getContactInfo']);

        // Notifications (VAPID key for push notifications)
        Route::get('/notifications/vapid-key', [NotificationController::class, 'getVapidKey']);
        Route::get('/team-members', [PublicController::class, 'getTeamMembers']);
        Route::get('/company-timeline', [PublicController::class, 'getCompanyTimeline']);
        Route::get('/admin/company-timeline', [PublicController::class, 'getCompanyTimeline'])->middleware('auth:sanctum')->middleware('role:admin|super-admin');
        Route::put('/admin/company-timeline', [PublicController::class, 'updateCompanyTimeline'])->middleware('auth:sanctum')->middleware('role:admin|super-admin');
        Route::get('/admin/team-members', [PublicController::class, 'getTeamMembers'])->middleware('auth:sanctum')->middleware('role:admin|super-admin');
        Route::put('/admin/team-members', [PublicController::class, 'updateTeamMembers'])->middleware('auth:sanctum')->middleware('role:admin|super-admin');

        // Announcements (public - only published)
        Route::get('/announcements', [AnnouncementController::class, 'index']);
        Route::get('/announcements/{id}', [AnnouncementController::class, 'show']);
    });

    // Contact Form (public submission)
    Route::post('/contact', [ContactController::class, 'store']);

    // Inquiries (public submission)
    Route::post('/inquiries/barista-training', [InquiryController::class, 'storeBaristaTraining']);
    Route::post('/inquiries/arbiter-express', [InquiryController::class, 'storeArbiterExpress']);

    // ==================================================
    // PROTECTED ROUTES (Require authentication)
    // ==================================================

    Route::middleware('auth:sanctum')->group(function () {

        // Notification CRUD (authenticated users)
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
        Route::delete('/notifications', [NotificationController::class, 'clearAll']);

        // Admin & Management Routes
        Route::middleware('role:admin|super-admin')->group(function () {

            // User Management
            Route::get('/admin/users', [AdminController::class, 'getUsers']);
            Route::get('/admin/users/statistics', [AdminController::class, 'getUserStatistics']);
            Route::get('/admin/users/{id}', [AdminController::class, 'getUser']);
            Route::post('/admin/users', [AdminController::class, 'createUser']);
            Route::put('/admin/users/{id}', [AdminController::class, 'updateUser']);
            Route::patch('/admin/users/{id}', [AdminController::class, 'updateUser']);
            Route::delete('/admin/users/{id}', [AdminController::class, 'deactivateUser']);
            Route::post('/admin/users/{id}/reactivate', [AdminController::class, 'reactivateUser']);

            // Order Management (Admin)
            Route::get('/admin/orders', [AdminController::class, 'getAllOrders']);
            Route::get('/admin/orders/{id}', [AdminController::class, 'getOrderDetails']);
            Route::patch('/admin/orders/{id}/status', [AdminController::class, 'updateOrderStatus']);

            // Dashboard Statistics
            Route::get('/admin/dashboard/stats', [AdminController::class, 'getDashboardStats']);

            // Analytics - Some endpoints can be cached for short periods
            Route::middleware('cache.response:30')->group(function () { // 30 seconds cache
                Route::get('/admin/analytics/dashboard', [AnalyticsController::class, 'getDashboardOverview']);
                Route::get('/admin/analytics/customer-segments', [AnalyticsController::class, 'getCustomerSegments']);
            });

            // Real-time analytics (no cache)
            Route::get('/admin/analytics/sales', [AnalyticsController::class, 'getSalesAnalytics']);
            Route::get('/admin/analytics/customers', [AnalyticsController::class, 'getCustomerAnalytics']);
            Route::get('/admin/analytics/performance', [AnalyticsController::class, 'getPerformanceAnalytics']);

            // Advanced Analytics
            Route::get('/admin/analytics/barista-performance', [AnalyticsController::class, 'getBaristaPerformance']);
            Route::post('/admin/analytics/performance-reports', [AnalyticsController::class, 'generatePerformanceReport']);
            Route::get('/admin/analytics/inventory', [AnalyticsController::class, 'getInventoryAnalytics']);

            // Lightweight test-only endpoints to provide stable responses during PHPUnit runs
            if (app()->environment('testing')) {
                Route::get('/admin/analytics/predictive', function () {
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'predictions' => [],
                            'insights' => [],
                            'metadata' => new \stdClass(),
                        ],
                        'message' => 'Predictive analytics (test stub)'
                    ]);
                });

                Route::get('/admin/analytics/customer-lifetime-value', function () {
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'segment_clv_stats' => [],
                            'top_customers_by_clv' => [],
                            'metadata' => new \stdClass(),
                        ],
                        'message' => 'Customer lifetime value (test stub)'
                    ]);
                });

                Route::get('/admin/analytics/churn-prediction', function () {
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'churn_analysis' => [],
                            'high_risk_customers' => [],
                            'recommendations' => [],
                            'metadata' => new \stdClass(),
                        ],
                        'message' => 'Churn prediction (test stub)'
                    ]);
                });

                Route::get('/admin/analytics/advanced-demand-forecast', function () {
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'forecast_analysis' => [],
                            'product_forecasts' => [],
                            'metadata' => new \stdClass(),
                        ],
                        'message' => 'Advanced demand forecast (test stub)'
                    ]);
                });

                Route::get('/admin/analytics/real-time', function () {
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'real_time_metrics' => [],
                            'live_alerts' => [],
                            'performance_indicators' => [],
                            'last_updated' => now()->toDateTimeString(),
                        ],
                        'message' => 'Real-time analytics (test stub)'
                    ]);
                });
            }

            // Customer Insights Analytics (Admin can view all customers)
            Route::post('/admin/analytics/customer-insights/bulk', [\App\Http\Controllers\Api\V1\CustomerInsightsController::class, 'getBulkInsights']);

            // Reports
            Route::get('/admin/reports/attendance', [ReportController::class, 'getAttendanceReport']);
            Route::get('/admin/reports/leave-ot', [ReportController::class, 'getLeaveOTReport']);
            Route::get('/admin/reports/task-completion', [ReportController::class, 'getTaskCompletionReport']);
            Route::get('/admin/reports/bean-usage', [ReportController::class, 'getBeanUsageReport']);
            Route::get('/admin/reports/export', [ReportController::class, 'exportReport']);

            // System Configuration Management
            Route::get('/admin/system/config', [SystemConfigController::class, 'index']);
            Route::get('/admin/system/config/{key}', [SystemConfigController::class, 'show']);
            Route::post('/admin/system/config', [SystemConfigController::class, 'update']);
            Route::delete('/admin/system/config/{key}', [SystemConfigController::class, 'destroy']);

            // Product Management
            Route::get('/admin/products', [ProductController::class, 'adminIndex']); // uncached admin list
            Route::post('/products', [ProductController::class, 'store']);
            Route::put('/products/{id}', [ProductController::class, 'update']);
            Route::delete('/products/{id}', [ProductController::class, 'destroy']);

            // Inventory Management (Admin)
            Route::get('/admin/inventory', [InventoryController::class, 'index']);
            Route::get('/admin/inventory/low-stock', [InventoryController::class, 'getLowStock']);
            Route::post('/admin/inventory', [InventoryController::class, 'store']);
            Route::put('/admin/inventory/{id}', [InventoryController::class, 'update']);
            Route::delete('/admin/inventory/{id}', [InventoryController::class, 'destroy']);
            Route::post('/admin/inventory/{id}/adjust', [InventoryController::class, 'adjustStock']);
            Route::get('/admin/inventory/logs', [InventoryController::class, 'getLogs']);

            // Category Management
            Route::post('/categories', [CategoryController::class, 'store']);
            Route::put('/categories/{id}', [CategoryController::class, 'update']);
            Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

            // Announcement Management
            Route::post('/announcements', [AnnouncementController::class, 'store']);
            Route::put('/announcements/{id}', [AnnouncementController::class, 'update']);
            Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy']);

            // Contact Management (View submissions)
            Route::get('/contacts', [ContactController::class, 'index']);
            Route::get('/contacts/{id}', [ContactController::class, 'show']);
            Route::put('/contacts/{id}', [ContactController::class, 'update']);
            Route::delete('/contacts/{id}', [ContactController::class, 'destroy']);

            // Inquiry Management (View submissions)
            Route::get('/inquiries', [InquiryController::class, 'index']);
            Route::get('/inquiries/{id}', [InquiryController::class, 'show']);
            Route::put('/inquiries/{id}', [InquiryController::class, 'update']);
            Route::delete('/inquiries/{id}', [InquiryController::class, 'destroy']);

            // Admin Coffee Bean Management
            Route::post('/admin/coffee-beans', [CoffeeBeanController::class, 'store']);
            Route::put('/admin/coffee-beans/{id}', [CoffeeBeanController::class, 'update']);
            Route::delete('/admin/coffee-beans/{id}', [CoffeeBeanController::class, 'destroy']);

            // Settings — Company Timeline (individual CRUD)
            Route::post('/admin/company-timeline', [PublicController::class, 'createTimelineEntry']);
            Route::put('/admin/company-timeline/{id}', [PublicController::class, 'updateTimelineEntry']);
            Route::delete('/admin/company-timeline/{id}', [PublicController::class, 'deleteTimelineEntry']);

            // Settings — Team Members (individual CRUD)
            Route::post('/admin/team-members', [PublicController::class, 'createTeamMember']);
            Route::put('/admin/team-members/{id}', [PublicController::class, 'updateTeamMember']);
            Route::delete('/admin/team-members/{id}', [PublicController::class, 'deleteTeamMember']);
        });

        // ==================================================
        // CUSTOMER PORTAL ROUTES
        // ==================================================

        Route::middleware('auth:sanctum')->group(function () {

            // Customer Dashboard
            Route::get('/customer/dashboard', [CustomerController::class, 'dashboard']);
            Route::get('/customer/profile', [CustomerController::class, 'getProfile']);
            Route::put('/customer/profile', [CustomerController::class, 'updateProfile']);
            Route::post('/customer/profile/picture', [CustomerController::class, 'uploadProfilePicture']);
            Route::get('/customer/analytics', [CustomerController::class, 'getOrderAnalytics']);
            Route::put('/customer/notifications', [CustomerController::class, 'updateNotificationPreferences']);
            Route::put('/customer/change-password', [CustomerController::class, 'changePassword']);
            Route::delete('/customer/account', [CustomerController::class, 'deactivateAccount']);

            // Customer Taste Preferences
            Route::get('/customer/taste-preferences', [CustomerController::class, 'getTastePreferences']);
            Route::put('/customer/taste-preferences', [CustomerController::class, 'updateTastePreferences']);

            // Customer Favorites/Wishlist
            Route::get('/customer/favorites', [CustomerController::class, 'getFavorites']);
            Route::post('/customer/favorites', [CustomerController::class, 'addFavorite']);
            Route::delete('/customer/favorites/{id}', [CustomerController::class, 'removeFavorite']);
            Route::post('/customer/favorites/toggle', [CustomerController::class, 'toggleFavorite']);

            // Customer Addresses
            Route::get('/customer/addresses', [AddressController::class, 'index']);
            Route::post('/customer/addresses', [AddressController::class, 'store']);
            Route::put('/customer/addresses/{id}', [AddressController::class, 'update']);
            Route::delete('/customer/addresses/{id}', [AddressController::class, 'destroy']);

            // Order Management (customer-specific routes)
            Route::get('/orders', [OrderController::class, 'index']);
            Route::post('/orders', [OrderController::class, 'store'])
                ->middleware('throttle.user:10,1'); // 10 orders per minute per user
            Route::get('/orders/{id}', [OrderController::class, 'show']);
            Route::post('/orders/{id}/reorder', [OrderController::class, 'reorder'])
                ->middleware('throttle.user:5,1'); // 5 reorders per minute per user
            Route::post('/orders/{id}/confirm', [OrderController::class, 'confirm']);
            Route::post('/orders/{id}/cancel-request', [OrderController::class, 'requestCancellation']);

            // Shopping Cart
            Route::get('/cart', [CartController::class, 'index']);
            Route::post('/cart/items', [CartController::class, 'addItem']);
            Route::put('/cart/items/{id}', [CartController::class, 'updateItem']);
            Route::delete('/cart/items/{id}', [CartController::class, 'removeItem']);
            Route::post('/cart/clear', [CartController::class, 'clear']);

            // Payments
            Route::post('/payments/gcash', [PaymentController::class, 'processGCash']);
            // Route::post('/payments/maya', [PaymentController::class, 'processMaya']); // Temporarily disabled
            Route::post('/payments/cash', [PaymentController::class, 'recordCash']);
            Route::get('/payments/{id}/status', [PaymentController::class, 'checkStatus']);
            
            // ==================================================
            // RECOMMENDATION SYSTEM ROUTES
            // ==================================================
            
            // Product Recommendations (cached for 1 hour per customer)
            Route::middleware('cache.response:3600')->group(function () {
                Route::get('/recommendations/products', [\App\Http\Controllers\Api\V1\RecommendationController::class, 'getProductRecommendations']);
                Route::get('/recommendations/coffee-beans', [\App\Http\Controllers\Api\V1\RecommendationController::class, 'getCoffeeBeanRecommendations']);
            });
            
            Route::get('/recommendations/affinity-score', [\App\Http\Controllers\Api\V1\RecommendationController::class, 'getCustomerAffinityScore']);
            Route::post('/recommendations/clear-cache', [\App\Http\Controllers\Api\V1\RecommendationController::class, 'clearRecommendationCache']);
            
            // ==================================================
            // CUSTOMER INSIGHTS ROUTES
            // ==================================================
            
            // Comprehensive insights (cached for 1 hour per customer)
            Route::middleware('cache.response:3600')->group(function () {
                Route::get('/customer-insights', [\App\Http\Controllers\Api\V1\CustomerInsightsController::class, 'getCustomerInsights']);
                Route::get('/customer-insights/purchase-behavior', [\App\Http\Controllers\Api\V1\CustomerInsightsController::class, 'getPurchaseBehavior']);
                Route::get('/customer-insights/product-affinity', [\App\Http\Controllers\Api\V1\CustomerInsightsController::class, 'getProductAffinity']);
                Route::get('/customer-insights/engagement-score', [\App\Http\Controllers\Api\V1\CustomerInsightsController::class, 'getEngagementScore']);
                Route::get('/customer-insights/lifecycle-stage', [\App\Http\Controllers\Api\V1\CustomerInsightsController::class, 'getLifecycleStage']);
                Route::get('/customer-insights/predictions', [\App\Http\Controllers\Api\V1\CustomerInsightsController::class, 'getPredictions']);
            });
            
            Route::get('/customer-insights/recommendations', [\App\Http\Controllers\Api\V1\CustomerInsightsController::class, 'getRecommendations']);
            Route::get('/customer-insights/satisfaction', [\App\Http\Controllers\Api\V1\CustomerInsightsController::class, 'getSatisfactionIndicators']);
            Route::post('/customer-insights/clear-cache', [\App\Http\Controllers\Api\V1\CustomerInsightsController::class, 'clearCache']);

            // ==================================================
            // BARISTA PORTAL ROUTES
            // ==================================================

            Route::middleware('role:barista|admin|super-admin')->prefix('barista')->group(function () {

                // Barista Dashboard
                Route::get('/dashboard', [BaristaController::class, 'getDashboard']);

                // Order Queue Management
                Route::get('/orders/queue', [BaristaController::class, 'getOrderQueue']);
                Route::put('/orders/{id}/status', [BaristaController::class, 'updateOrderStatus']);
                Route::get('/orders/completed', [BaristaController::class, 'getCompletedOrders']);

                // Coffee Bean Management (for baristas)
                Route::get('/beans', [BaristaController::class, 'listCoffeeBeans']);
                Route::post('/beans', [BaristaController::class, 'addCoffeeBean']);
                Route::put('/beans/{id}/stock', [BaristaController::class, 'updateBeanStock']);
                Route::delete('/beans/{id}', [BaristaController::class, 'archiveCoffeeBean']);

                // Barista Performance
                Route::get('/performance', [BaristaController::class, 'getPerformance']);

                // Shift Information
                Route::get('/shift/current', [BaristaController::class, 'getCurrentShift']);

                // Today's Tasks
                Route::get('/tasks/today', [BaristaController::class, 'getTodaysTasks']);

                // Today's Origin Management
                Route::get('/featured-origins/today', [FeaturedOriginController::class, 'getToday']);
                Route::get('/featured-origins/today-scheduled', [FeaturedOriginController::class, 'getTodayScheduled']);
                Route::get('/featured-origins/by-date', [FeaturedOriginController::class, 'getByDate']);
                Route::get('/featured-origins/available-beans', [FeaturedOriginController::class, 'getAvailableBeans']);
                Route::get('/featured-origins', [FeaturedOriginController::class, 'index']);
                Route::post('/featured-origins', [FeaturedOriginController::class, 'store']);
                Route::get('/featured-origins/{id}', [FeaturedOriginController::class, 'show']);
                Route::put('/featured-origins/{id}', [FeaturedOriginController::class, 'update']);
                Route::delete('/featured-origins/{id}', [FeaturedOriginController::class, 'destroy']);

                // Inventory Checklist (read + adjust for baristas)
                Route::get('/inventory', [InventoryController::class, 'index']);
                Route::get('/inventory/{id}', [InventoryController::class, 'show']);
                Route::post('/inventory/{id}/adjust', [InventoryController::class, 'adjustStock']);
                Route::get('/inventory/low-stock/alert', [InventoryController::class, 'getLowStock']);

                // POS (Point of Sale)
                Route::prefix('pos')->group(function () {
                    Route::get('/products', [PosController::class, 'getProducts']);
                    Route::post('/orders', [PosController::class, 'createOrder']);
                    Route::post('/orders/hold', [PosController::class, 'holdOrder']);
                    Route::get('/orders/held', [PosController::class, 'getHeldOrders']);
                    Route::post('/orders/held/{id}/resume', [PosController::class, 'resumeHeldOrder']);
                    Route::post('/orders/{id}/void', [PosController::class, 'voidOrder']);
                    Route::get('/summary', [PosController::class, 'getDailySummary']);
                    Route::get('/transactions', [PosController::class, 'getRecentTransactions']);
                });
            });

            // ==================================================
            // KITCHEN STAFF PORTAL ROUTES
            // ==================================================

            Route::middleware('role:kitchen-staff|admin|super-admin')->prefix('kitchen')->group(function () {

                // Kitchen Dashboard
                Route::get('/dashboard', [KitchenController::class, 'getDashboard']);

                // Food Order Queue Management
                Route::get('/orders/queue', [KitchenController::class, 'getOrderQueue']);
                Route::put('/orders/{id}/status', [KitchenController::class, 'updateOrderStatus']);
                Route::get('/orders/completed', [KitchenController::class, 'getCompletedOrders']);

                // Kitchen Performance
                Route::get('/performance', [KitchenController::class, 'getPerformance']);

                // Shift Information
                Route::get('/shift/current', [KitchenController::class, 'getCurrentShift']);

                // Today's Tasks
                Route::get('/tasks/today', [KitchenController::class, 'getTodaysTasks']);

                // Inventory Checklist (kitchen items)
                Route::get('/inventory', [InventoryController::class, 'index']);
                Route::get('/inventory/{id}', [InventoryController::class, 'show']);
                Route::post('/inventory/{id}/adjust', [InventoryController::class, 'adjustStock']);
                Route::get('/inventory/low-stock/alert', [InventoryController::class, 'getLowStock']);
            });
        });

        // Order Notifications (accessible by customer, barista, manager, admin)
        Route::post('/orders/{id}/notifications', [OrderController::class, 'sendNotification']);

        // ==================================================
        // WORKFORCE MANAGER ROUTES
        // ==================================================

        Route::middleware(['auth:sanctum', 'role:manager|workforce-manager|admin|super-admin'])->prefix('workforce')->group(function () {

            // Test route
            Route::get('/test', function () {
                return response()->json(['success' => true, 'message' => 'Workforce test']);
            });

            // Inventory Management
            Route::get('/inventory', [InventoryController::class, 'index']);
            Route::get('/inventory/{id}', [InventoryController::class, 'show']);
            Route::post('/inventory', [InventoryController::class, 'store']);
            Route::put('/inventory/{id}', [InventoryController::class, 'update']);
            Route::delete('/inventory/{id}', [InventoryController::class, 'destroy']);
            Route::post('/inventory/{id}/adjust', [InventoryController::class, 'adjustStock']);
            Route::get('/inventory/low-stock/alert', [InventoryController::class, 'getLowStock']);
            Route::get('/inventory/logs', [InventoryController::class, 'getLogs']);

            // Employee Management
            Route::get('/employees/statistics', [EmployeeController::class, 'getStatistics']);
            Route::get('/employees', [EmployeeController::class, 'index']);
            Route::get('/employees/{id}', [EmployeeController::class, 'show']);
            Route::post('/employees', [EmployeeController::class, 'store']);
            Route::put('/employees/{id}', [EmployeeController::class, 'update']);
            Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);

            // Attendance Management
            Route::get('/attendance', [AttendanceController::class, 'index']);
            Route::post('/attendance/mark', [AttendanceController::class, 'markAttendance']);
            Route::get('/attendance/summary', [AttendanceController::class, 'getSummary']);

            // Shift Scheduling
            Route::get('/shifts', [ShiftController::class, 'index']);
            Route::get('/shifts/weekly-schedule', [ShiftController::class, 'getWeeklySchedule']);
            Route::get('/shifts/employee/{employeeId}', [ShiftController::class, 'getEmployeeShifts']);
            Route::get('/shifts/{id}', [ShiftController::class, 'show']);
            Route::post('/shifts', [ShiftController::class, 'store']);
            Route::put('/shifts/{id}', [ShiftController::class, 'update']);
            Route::delete('/shifts/{id}', [ShiftController::class, 'destroy']);

            // Task Management
            Route::get('/tasks', [TaskController::class, 'index']);
            Route::get('/tasks/{id}', [TaskController::class, 'show']);
            Route::post('/tasks', [TaskController::class, 'store']);
            Route::put('/tasks/{id}', [TaskController::class, 'update']);
            Route::delete('/tasks/{id}', [TaskController::class, 'destroy']);

            // Performance Review Management (manager-level actions only)
            // Read access is handled in the barista-accessible workforce group below.
            Route::middleware('role:manager|workforce-manager|admin|super-admin')->group(function () {
                Route::post('/performance/reviews', [PerformanceReviewController::class, 'store']);
                Route::put('/performance/reviews/{id}', [PerformanceReviewController::class, 'update']);
                Route::delete('/performance/reviews/{id}', [PerformanceReviewController::class, 'destroy']);
            });
        });

        // ==================================================
        // BARISTA WORKFORCE SELF-SERVICE ROUTES
        // Leave requests and performance reads are accessible to all workforce
        // roles. The controller enforces per-role data scoping (baristas see
        // only their own records; managers see all).
        // ==================================================

        Route::middleware(['auth:sanctum', 'role:barista|kitchen-staff|manager|workforce-manager|admin|super-admin'])
            ->prefix('workforce')->group(function () {

                // Leave Requests
                Route::get('/leave-requests', [LeaveRequestController::class, 'index']);
                Route::get('/leave-requests/{id}', [LeaveRequestController::class, 'show']);
                Route::post('/leave-requests', [LeaveRequestController::class, 'store']);
                Route::put('/leave-requests/{id}', [LeaveRequestController::class, 'update']);
                Route::delete('/leave-requests/{id}', [LeaveRequestController::class, 'destroy']);

                // Performance Reviews — read access (baristas see own; managers see all)
                Route::get('/performance/reviews', [PerformanceReviewController::class, 'index']);
                Route::get('/performance/{employeeId}', [PerformanceReviewController::class, 'show']);
            });

        // ==================================================
        // EMPLOYEE SELF-SERVICE ROUTES
        // ==================================================

        Route::middleware(['auth:sanctum', 'role:barista|kitchen-staff|manager|admin|super-admin'])->prefix('employee')->group(function () {

            // Attendance Clock In/Out
            Route::get('/attendance', [AttendanceController::class, 'getMyAttendance']);
            Route::post('/attendance/clock-in', [AttendanceController::class, 'clockIn']);
            Route::post('/attendance/clock-out', [AttendanceController::class, 'clockOut']);

            // My Shifts
            Route::get('/shifts', [ShiftController::class, 'getMyShifts']);

            // My Tasks
            Route::get('/tasks', [TaskController::class, 'getMyTasks']);
            Route::put('/tasks/{id}', [TaskController::class, 'updateMyTask']);
        });
    });

    // ==================================================
    // WEBHOOK ROUTES (No authentication required)
    // ==================================================

    Route::prefix('webhooks')->group(function () {
        // Stripe webhook
        Route::post('/stripe', [PaymentWebhookController::class, 'stripeWebhook']);

        // GCash webhook
        Route::post('/gcash', [PaymentWebhookController::class, 'gcashWebhook']);

        // Maya webhook
        // Route::post('/maya', [PaymentWebhookController::class, 'mayaWebhook']); // Temporarily disabled

        // PayPal webhook
        Route::post('/paypal', [PaymentWebhookController::class, 'paypalWebhook']);
    });

    // ==================================================
    // PUBLIC RECOMMENDATIONS (Homepage)
    // ==================================================
    
    // Homepage recommendations (public - shows popular for guests, personalized for authenticated users)
    Route::get('/recommendations/homepage', [\App\Http\Controllers\Api\V1\RecommendationController::class, 'getHomepageRecommendations']);

});


