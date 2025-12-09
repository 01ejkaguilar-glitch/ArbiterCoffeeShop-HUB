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
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\BaristaController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\ShiftController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\SystemConfigController;
use App\Http\Controllers\Api\LeaveRequestController;
use App\Http\Controllers\Api\PerformanceReviewController;
use App\Http\Controllers\Api\V1\PaymentWebhookController;
use Illuminate\Support\Facades\Route;

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
    });

    // ==================================================
    // PUBLIC ROUTES (No authentication required) - Enhanced caching
    // ==================================================

    Route::middleware('cache.response:300')->group(function () { // 5 minutes cache
        // Products (public browsing)
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/{id}', [ProductController::class, 'show']);

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

            // Real-time analytics (no cache)
            Route::get('/admin/analytics/sales', [AnalyticsController::class, 'getSalesAnalytics']);
            Route::get('/admin/analytics/customers', [AnalyticsController::class, 'getCustomerAnalytics']);
            Route::get('/admin/analytics/performance', [AnalyticsController::class, 'getPerformanceAnalytics']);

            // System Configuration Management
            Route::get('/admin/system/config', [SystemConfigController::class, 'index']);
            Route::get('/admin/system/config/{key}', [SystemConfigController::class, 'show']);
            Route::post('/admin/system/config', [SystemConfigController::class, 'update']);
            Route::delete('/admin/system/config/{key}', [SystemConfigController::class, 'destroy']);

            // Product Management
            Route::post('/products', [ProductController::class, 'store']);
            Route::put('/products/{id}', [ProductController::class, 'update']);
            Route::delete('/products/{id}', [ProductController::class, 'destroy']);

            // Category Management
            Route::post('/categories', [CategoryController::class, 'store']);
            Route::put('/categories/{id}', [CategoryController::class, 'update']);
            Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

            // Coffee Bean Management
            Route::post('/coffee-beans', [CoffeeBeanController::class, 'store']);
            Route::put('/coffee-beans/{id}', [CoffeeBeanController::class, 'update']);
            Route::delete('/coffee-beans/{id}', [CoffeeBeanController::class, 'destroy']);

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
            Route::delete('/customer/account', [CustomerController::class, 'deactivateAccount']);

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
        });

        // Order Notifications (accessible by customer, barista, manager, admin)
        Route::post('/orders/{id}/notifications', [OrderController::class, 'sendNotification']);

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
            Route::put('/beans/{id}/stock', [BaristaController::class, 'updateBeanStock']);

            // Barista Performance
            Route::get('/performance', [BaristaController::class, 'getPerformance']);
        });

        // ==================================================
        // WORKFORCE MANAGER ROUTES
        // ==================================================

        Route::middleware('role:workforce-manager|admin|super-admin')->prefix('workforce')->group(function () {

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
            Route::get('/shifts/{id}', [ShiftController::class, 'show']);
            Route::post('/shifts', [ShiftController::class, 'store']);
            Route::put('/shifts/{id}', [ShiftController::class, 'update']);
            Route::delete('/shifts/{id}', [ShiftController::class, 'destroy']);
            Route::get('/shifts/weekly-schedule', [ShiftController::class, 'getWeeklySchedule']);
            Route::get('/shifts/employee/{employeeId}', [ShiftController::class, 'getEmployeeShifts']);

            // Task Management
            Route::get('/tasks', [TaskController::class, 'index']);
            Route::get('/tasks/{id}', [TaskController::class, 'show']);
            Route::post('/tasks', [TaskController::class, 'store']);
            Route::put('/tasks/{id}', [TaskController::class, 'update']);
            Route::delete('/tasks/{id}', [TaskController::class, 'destroy']);
        });

        // ==================================================
        // WORKFORCE - LEAVE & PERFORMANCE (Employees + Managers)
        // ==================================================

        Route::middleware('role:barista|manager|workforce-manager|admin|super-admin')->prefix('workforce')->group(function () {

            // Leave Request Management
            Route::get('/leave-requests', [LeaveRequestController::class, 'index']);
            Route::get('/leave-requests/{id}', [LeaveRequestController::class, 'show']);
            Route::post('/leave-requests', [LeaveRequestController::class, 'store']);
            Route::put('/leave-requests/{id}', [LeaveRequestController::class, 'update']);
            Route::delete('/leave-requests/{id}', [LeaveRequestController::class, 'destroy']);

            // Performance Review Management
            Route::get('/performance/reviews', [PerformanceReviewController::class, 'index']);
            Route::post('/performance/reviews', [PerformanceReviewController::class, 'store']);
            Route::put('/performance/reviews/{id}', [PerformanceReviewController::class, 'update']);
            Route::delete('/performance/reviews/{id}', [PerformanceReviewController::class, 'destroy']);
            Route::get('/performance/{employeeId}', [PerformanceReviewController::class, 'show']);
        });

        // ==================================================
        // EMPLOYEE SELF-SERVICE ROUTES
        // ==================================================

        Route::middleware('role:barista|manager|admin|super-admin')->prefix('employee')->group(function () {

            // Attendance Clock In/Out
            Route::post('/attendance/clock-in', [AttendanceController::class, 'clockIn']);
            Route::post('/attendance/clock-out', [AttendanceController::class, 'clockOut']);

            // My Tasks
            Route::get('/tasks', [TaskController::class, 'getMyTasks']);
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
});
