<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class CacheResponse
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, int $minutes = 60): Response
    {
        // Only cache GET requests
        if ($request->method() !== 'GET') {
            return $next($request);
        }

        // Don't cache authenticated user-specific data
        if ($request->user()) {
            return $next($request);
        }

        // Don't cache requests with certain query parameters that indicate personalization
        if ($this->hasPersonalizationParams($request)) {
            return $next($request);
        }

        // Generate cache key based on URL and query parameters
        $cacheKey = $this->getCacheKey($request);

        // Try to get cached response
        $cachedResponse = Cache::get($cacheKey);

        if ($cachedResponse) {
            return response()->json($cachedResponse['data'])
                ->header('X-Cache', 'HIT')
                ->header('X-Cache-Key', $cacheKey)
                ->header('Cache-Control', "public, max-age={$minutes}")
                ->header('X-Cache-Timestamp', $cachedResponse['timestamp']);
        }

        // Process request
        $response = $next($request);

        // Cache successful JSON responses
        if ($response->isSuccessful() && $response->headers->get('Content-Type') === 'application/json') {
            $content = json_decode($response->getContent(), true);

            if ($content && isset($content['success']) && $content['success']) {
                $cacheData = [
                    'data' => $content,
                    'timestamp' => now()->toISOString(),
                    'url' => $request->fullUrl(),
                    'user_agent' => $request->userAgent()
                ];

                Cache::put($cacheKey, $cacheData, now()->addMinutes($minutes));
            }
        }

        $response->headers->set('X-Cache', 'MISS');
        $response->headers->set('X-Cache-Key', $cacheKey);
        $response->headers->set('Cache-Control', "public, max-age={$minutes}");

        return $response;
    }

    /**
     * Check if request has personalization parameters that shouldn't be cached
     */
    private function hasPersonalizationParams(Request $request): bool
    {
        $personalizationParams = [
            'user_id',
            'customer_id',
            'session_id',
            'token',
            'api_key',
            'auth_token',
            'personalized'
        ];

        foreach ($personalizationParams as $param) {
            if ($request->has($param)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Generate a cache key for the request.
     */
    private function getCacheKey(Request $request): string
    {
        $url = $request->url();
        $queryParams = $request->query();

        ksort($queryParams);

        return 'api_cache:' . md5($url . serialize($queryParams));
    }
}
