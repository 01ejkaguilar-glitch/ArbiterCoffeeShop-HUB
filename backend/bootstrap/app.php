<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Register Spatie Permission middleware aliases
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'cache.response' => \App\Http\Middleware\CacheResponse::class,
            'throttle.user' => \App\Http\Middleware\ThrottleByUser::class,
        ]);

        // Register API performance monitoring and compression middleware
        $middleware->api(append: [
            \App\Http\Middleware\ApiPerformanceMonitor::class,
            \App\Http\Middleware\CompressResponse::class,
            \App\Http\Middleware\SecurityHeaders::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $getStatusCode = function (Throwable $e): int {
            if (method_exists($e, 'getStatusCode')) {
                return $e->getStatusCode();
            }

            if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                return 401;
            }

            if ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
                return 403;
            }

            if ($e instanceof \Illuminate\Validation\ValidationException) {
                return 422;
            }

            if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                return 404;
            }

            return 500;
        };

        $exceptions->report(function (Throwable $e) {
            $errorTracking = app(\App\Services\ErrorTrackingService::class);
            $errorTracking->logException($e, request());
        });

        // Customize exception rendering for API requests
        $exceptions->render(function (Throwable $e, $request) use ($getStatusCode) {
            if ($request->is('api/*')) {
                $errorTracking = app(\App\Services\ErrorTrackingService::class);

                // Log API errors
                $errorTracking->logApiError(
                    $e->getMessage(),
                    $getStatusCode($e),
                    ['exception' => get_class($e)],
                    $request
                );

                return response()->json([
                    'success' => false,
                    'message' => config('app.debug') ? $e->getMessage() : 'An error occurred',
                    'error' => config('app.debug') ? [
                        'type' => get_class($e),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                        'trace' => $e->getTraceAsString(),
                    ] : null,
                    'request_id' => $request->header('X-Request-ID'),
                ], $getStatusCode($e));
            }
        });
    })->withSchedule(function ($schedule): void {
        // Generate monitoring reports daily at 2 AM
        $schedule->command('monitoring:report')
            ->dailyAt('02:00')
            ->withoutOverlapping()
            ->runInBackground();

        // Clean up old logs weekly on Sunday at 3 AM
        $schedule->command('logs:clean --days=30')
            ->weeklyOn(0, '03:00')
            ->withoutOverlapping()
            ->runInBackground();

        // Health check monitoring every 5 minutes
        $schedule->command('health:check')
            ->everyFiveMinutes()
            ->withoutOverlapping()
            ->runInBackground();
    })->create();
