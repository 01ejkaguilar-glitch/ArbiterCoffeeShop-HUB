<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CompressResponse
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Check if client supports gzip compression
        $acceptEncoding = $request->header('Accept-Encoding', '');
        
        if (!str_contains($acceptEncoding, 'gzip')) {
            return $response;
        }

        // Only compress text-based content types
        $contentType = $response->headers->get('Content-Type', '');
        $compressibleTypes = [
            'application/json',
            'text/html',
            'text/plain',
            'text/xml',
            'application/xml',
            'text/css',
            'application/javascript',
        ];

        $shouldCompress = false;
        foreach ($compressibleTypes as $type) {
            if (str_contains($contentType, $type)) {
                $shouldCompress = true;
                break;
            }
        }

        if (!$shouldCompress) {
            return $response;
        }

        // Don't compress if already compressed
        if ($response->headers->has('Content-Encoding')) {
            return $response;
        }

        $content = $response->getContent();
        
        // Only compress if content is large enough (>1KB)
        if (strlen($content) < 1024) {
            return $response;
        }

        // Compress the content
        $compressed = gzencode($content, 6); // Compression level 6 (balanced)

        if ($compressed !== false) {
            $response->setContent($compressed);
            $response->headers->set('Content-Encoding', 'gzip');
            $response->headers->set('Content-Length', strlen($compressed));
            $response->headers->set('Vary', 'Accept-Encoding');
        }

        return $response;
    }
}
