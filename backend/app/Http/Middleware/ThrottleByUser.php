<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class ThrottleByUser
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, int $maxAttempts = 60, int $decayMinutes = 1): Response
    {
        $user = $request->user();
        $ip = $request->ip();

        // Use user ID if authenticated, otherwise use IP address
        $key = $user ? 'user:' . $user->id : 'ip:' . $ip;

        // Add route-specific throttling
        $routeName = $request->route() ? $request->route()->getName() : 'unknown';
        $key .= ':' . $routeName;

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $secondsUntilAvailable = RateLimiter::availableIn($key);

            return response()->json([
                'success' => false,
                'message' => 'Too many requests. Please try again later.',
                'retry_after_seconds' => $secondsUntilAvailable,
                'limit' => $maxAttempts,
                'decay_minutes' => $decayMinutes
            ], 429)->header('Retry-After', $secondsUntilAvailable);
        }

        RateLimiter::hit($key, $decayMinutes * 60);

        $response = $next($request);

        // Add rate limit headers to response
        $response->headers->set('X-RateLimit-Limit', $maxAttempts);
        $response->headers->set('X-RateLimit-Remaining', max(0, $maxAttempts - RateLimiter::attempts($key)));
        $response->headers->set('X-RateLimit-Reset', now()->addSeconds(RateLimiter::availableIn($key))->timestamp);

        return $response;
    }
}
