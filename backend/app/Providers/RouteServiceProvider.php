<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to your application's "home" route.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/dashboard';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }

    /**
     * Configure the rate limiters for the application.
     */
    protected function configureRateLimiting(): void
    {
        // General API rate limit: 100 requests per minute
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(100)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Too many requests. Please try again later.',
                        'retry_after' => $headers['Retry-After'] ?? 60
                    ], 429, $headers);
                });
        });

        // ML endpoints: 20 requests per minute (more resource-intensive)
        RateLimiter::for('ml', function (Request $request) {
            return Limit::perMinute(20)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Too many ML requests. Please wait before trying again.',
                        'retry_after' => $headers['Retry-After'] ?? 60
                    ], 429, $headers);
                });
        });

        // Public endpoints (auth): 10 requests per minute (prevent brute force)
        RateLimiter::for('public', function (Request $request) {
            return Limit::perMinute(10)
                ->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Too many attempts. Please try again later.',
                        'retry_after' => $headers['Retry-After'] ?? 60
                    ], 429, $headers);
                });
        });

        // Login-specific: 100 attempts per minute (relaxed for development)
        RateLimiter::for('login', function (Request $request) {
            $email = (string) $request->email;

            return Limit::perMinute(100)
                ->by($email . $request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Too many login attempts. Please try again in ' . ($headers['Retry-After'] ?? 60) . ' seconds.',
                        'retry_after' => $headers['Retry-After'] ?? 60
                    ], 429, $headers);
                });
        });

        // File uploads: 20 per hour (prevent abuse)
        RateLimiter::for('uploads', function (Request $request) {
            return Limit::perHour(20)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Upload limit reached. Please try again later.',
                        'retry_after' => $headers['Retry-After'] ?? 3600
                    ], 429, $headers);
                });
        });
    }
}
