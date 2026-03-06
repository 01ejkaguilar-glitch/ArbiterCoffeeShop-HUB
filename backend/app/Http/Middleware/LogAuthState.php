<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class LogAuthState
{
    /**
     * Log authorization header and authentication state (test-only middleware).
     */
    public function handle(Request $request, Closure $next)
    {
        // Log raw Authorization header and auth state to both Laravel logger and a test-specific file
        $authHeader = $request->header('Authorization');
        $authState = ['authenticated' => Auth::check(), 'user_id' => Auth::id()];

        // Laravel logger (may be misconfigured in tests but keep for completeness)
        Log::debug('LogAuthState: Authorization header', ['authorization' => $authHeader]);
        Log::debug('LogAuthState: auth check', $authState);

        // Also write to stderr so PHPUnit captures it, then attempt a file write
        try {
            $entry = '[' . date('c') . '] Authorization: ' . ($authHeader ?? 'null') . ' | ' . json_encode($authState) . PHP_EOL;
            // Write to stdout as well — test runners may capture stderr differently
            @file_put_contents('php://stdout', $entry);
            @file_put_contents('php://stderr', $entry);

            $path = storage_path('logs/auth_debug.log');
            @file_put_contents($path, $entry, FILE_APPEND | LOCK_EX);
        } catch (\Throwable $e) {
            // Swallow errors — this is diagnostic only
        }

        return $next($request);
    }
}
