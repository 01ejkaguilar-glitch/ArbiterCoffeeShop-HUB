<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ApiPerformanceMonitor
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);
        $startMemory = memory_get_usage();

        // Add request ID for tracking
        $requestId = $request->header('X-Request-ID', uniqid('req_', true));

        // Process the request
        $response = $next($request);

        // Calculate performance metrics
        $endTime = microtime(true);
        $endMemory = memory_get_usage();

        $executionTime = ($endTime - $startTime) * 1000; // Convert to milliseconds
        $memoryUsed = $endMemory - $startMemory;

        // Add performance headers to response
        $response->headers->set('X-Response-Time', round($executionTime, 2) . 'ms');
        $response->headers->set('X-Memory-Usage', $this->formatBytes($memoryUsed));
        $response->headers->set('X-Request-ID', $requestId);

        // Log performance metrics
        $this->logPerformanceMetrics($request, $response, $executionTime, $memoryUsed, $requestId);

        return $response;
    }

    /**
     * Format bytes to human-readable format
     */
    protected function formatBytes(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes . 'B';
        } elseif ($bytes < 1048576) {
            return round($bytes / 1024, 2) . 'KB';
        } else {
            return round($bytes / 1048576, 2) . 'MB';
        }
    }

    /**
     * Log performance metrics to file
     */
    protected function logPerformanceMetrics(Request $request, Response $response, float $executionTime, int $memoryUsed, string $requestId): void
    {
        $route = $request->route();
        $routeName = $route ? $route->getName() : 'unknown';

        $metrics = [
            'request_id' => $requestId,
            'timestamp' => now()->toDateTimeString(),
            'method' => $request->method(),
            'endpoint' => $request->path(),
            'route' => $routeName,
            'execution_time_ms' => round($executionTime, 2),
            'memory_kb' => round($memoryUsed / 1024, 2),
            'status_code' => $response->getStatusCode(),
            'user_id' => $request->user()?->id,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ];

        // Log to performance channel
        Log::channel('performance')->info('API Request', $metrics);

        // Log slow requests with warnings
        if ($executionTime > 2000) { // Over 2 seconds
            Log::channel('performance')->warning('Slow API Request', array_merge($metrics, [
                'threshold' => '2000ms',
                'recommendation' => 'Consider optimizing this endpoint'
            ]));
        }

        // Log very slow requests as errors
        if ($executionTime > 10000) { // Over 10 seconds
            Log::channel('performance')->error('Very Slow API Request', array_merge($metrics, [
                'threshold' => '10000ms',
                'recommendation' => 'Immediate optimization required'
            ]));
        }

        // Log high memory usage
        if ($memoryUsed > 50 * 1024 * 1024) { // Over 50MB
            Log::channel('performance')->warning('High Memory Usage', array_merge($metrics, [
                'threshold' => '50MB',
                'recommendation' => 'Check for memory leaks'
            ]));
        }

        // Log errors and exceptions
        if ($response->getStatusCode() >= 500) {
            Log::channel('errors')->error('API Server Error', array_merge($metrics, [
                'error_type' => 'server_error',
                'severity' => 'high'
            ]));
        } elseif ($response->getStatusCode() >= 400) {
            Log::channel('errors')->warning('API Client Error', array_merge($metrics, [
                'error_type' => 'client_error',
                'severity' => 'medium'
            ]));
        }

        // Log security events
        if ($response->getStatusCode() === 401 || $response->getStatusCode() === 403) {
            Log::channel('security')->warning('Authentication/Authorization Failure', array_merge($metrics, [
                'event_type' => 'auth_failure',
                'severity' => 'medium'
            ]));
        }

        // Log rate limiting
        if ($response->getStatusCode() === 429) {
            Log::channel('security')->warning('Rate Limit Exceeded', array_merge($metrics, [
                'event_type' => 'rate_limit',
                'severity' => 'low'
            ]));
        }
    }
}
