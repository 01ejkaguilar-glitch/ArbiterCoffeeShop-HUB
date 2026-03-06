<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

class PrerenderMiddleware
{
    /**
     * List of crawler user agents to detect
     */
    protected array $crawlerUserAgents = [
        'googlebot',
        'bingbot',
        'slurp',
        'duckduckbot',
        'baiduspider',
        'yandexbot',
        'facebookexternalhit',
        'twitterbot',
        'whatsapp',
        'linkedinbot',
        'slackbot',
        'telegrambot',
    ];

    /**
     * Extensions that should not be pre-rendered
     */
    protected array $ignoredExtensions = [
        '.js',
        '.css',
        '.xml',
        '.less',
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        '.pdf',
        '.doc',
        '.txt',
        '.ico',
        '.rss',
        '.zip',
        '.mp3',
        '.rar',
        '.exe',
        '.wmv',
        '.doc',
        '.avi',
        '.ppt',
        '.mpg',
        '.mpeg',
        '.tif',
        '.wav',
        '.mov',
        '.psd',
        '.ai',
        '.xls',
        '.mp4',
        '.m4a',
        '.swf',
        '.dat',
        '.dmg',
        '.iso',
        '.flv',
        '.m4v',
        '.torrent',
        '.woff',
        '.ttf',
        '.svg',
        '.webp',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if prerender is enabled
        if (!config('prerender.enable', false)) {
            return $next($request);
        }

        // Skip if not a GET request
        if (!$request->isMethod('GET')) {
            return $next($request);
        }

        // Skip if it's an admin/api/barista/customer route
        if ($this->shouldSkipRoute($request)) {
            return $next($request);
        }

        // Skip if has ignored extension
        if ($this->hasIgnoredExtension($request)) {
            return $next($request);
        }

        // Check if request is from a crawler
        if (!$this->isCrawler($request)) {
            return $next($request);
        }

        // Fetch pre-rendered page from Prerender.io
        return $this->getPrerenderResponse($request) ?? $next($request);
    }

    /**
     * Check if request is from a crawler
     */
    protected function isCrawler(Request $request): bool
    {
        $userAgent = strtolower($request->userAgent() ?? '');

        // Check for _escaped_fragment_ parameter (old Google AJAX crawling)
        if ($request->has('_escaped_fragment_')) {
            return true;
        }

        // Check user agent against known crawlers
        foreach ($this->crawlerUserAgents as $crawler) {
            if (str_contains($userAgent, $crawler)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if route should be skipped
     */
    protected function shouldSkipRoute(Request $request): bool
    {
        $path = $request->path();

        $skipPrefixes = ['api', 'admin', 'barista', 'customer', 'storage'];

        foreach ($skipPrefixes as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if URL has ignored extension
     */
    protected function hasIgnoredExtension(Request $request): bool
    {
        $path = $request->path();

        foreach ($this->ignoredExtensions as $extension) {
            if (str_ends_with($path, $extension)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get pre-rendered response from Prerender.io
     */
    protected function getPrerenderResponse(Request $request): ?Response
    {
        try {
            $token = config('prerender.token');
            $prerenderUrl = config('prerender.url', 'https://service.prerender.io');

            if (empty($token)) {
                \Log::warning('Prerender token not configured');
                return null;
            }

            // Build the URL to prerender
            $url = $request->fullUrl();

            // Make request to Prerender.io
            $response = Http::timeout(10)
                ->withHeaders([
                    'X-Prerender-Token' => $token,
                    'User-Agent' => $request->userAgent(),
                ])
                ->get($prerenderUrl . '/' . $url);

            if ($response->successful()) {
                return response($response->body())
                    ->header('Content-Type', 'text/html; charset=UTF-8')
                    ->header('X-Prerender', 'true');
            }

            \Log::error('Prerender.io request failed', [
                'status' => $response->status(),
                'url' => $url,
            ]);

            return null;
        } catch (\Exception $e) {
            \Log::error('Prerender middleware error: ' . $e->getMessage());
            return null;
        }
    }
}
