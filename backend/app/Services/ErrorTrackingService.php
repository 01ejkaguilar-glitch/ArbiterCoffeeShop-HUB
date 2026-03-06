<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class ErrorTrackingService
{
    /**
     * Log an exception with context.
     */
    public function logException(Throwable $e, ?Request $request = null): void
    {
        $context = [
            'exception' => get_class($e),
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ];

        if ($request) {
            $context['url'] = $request->fullUrl();
            $context['method'] = $request->method();
            $context['ip'] = $request->ip();
            $context['user_id'] = $request->user()?->id;
        }

        Log::error('Exception: ' . $e->getMessage(), $context);
    }

    /**
     * Log an API error with request context.
     */
    public function logApiError(
        string $message,
        int $statusCode,
        array $extra = [],
        ?Request $request = null
    ): void {
        $context = array_merge([
            'status_code' => $statusCode,
        ], $extra);

        if ($request) {
            $context['url'] = $request->fullUrl();
            $context['method'] = $request->method();
            $context['ip'] = $request->ip();
            $context['user_id'] = $request->user()?->id;
            $context['request_id'] = $request->header('X-Request-ID');
        }

        Log::channel('stack')->error("API Error [{$statusCode}]: {$message}", $context);
    }
}
