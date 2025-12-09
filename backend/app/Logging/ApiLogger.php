<?php

namespace App\Logging;

use Monolog\Processor\ProcessorInterface;
use Monolog\LogRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ApiLogger implements ProcessorInterface
{
    /**
     * Process log records to add API-specific context
     */
    public function __invoke(LogRecord $record): LogRecord
    {
        $request = request();

        if ($request instanceof Request) {
            $extra = $record->extra ?? [];

            $extra['api'] = [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'user_id' => Auth::id(),
                'route' => $request->route() ? $request->route()->getName() : null,
                'request_id' => $request->header('X-Request-ID', uniqid('req_', true)),
                'duration' => defined('LARAVEL_START') ? microtime(true) - LARAVEL_START : null,
                'memory_peak' => memory_get_peak_usage(true),
            ];

            // Add request/response data for debugging (only in debug mode)
            if (config('app.debug') && $record->level >= 300) { // WARNING and above
                $extra['api']['headers'] = $request->header();
                $extra['api']['query_params'] = $request->query();

                // Don't log sensitive data
                $input = $request->all();
                $sensitiveFields = ['password', 'password_confirmation', 'token', 'api_key', 'secret'];
                foreach ($sensitiveFields as $field) {
                    if (isset($input[$field])) {
                        $input[$field] = '[REDACTED]';
                    }
                }
                $extra['api']['input'] = $input;
            }

            $record = $record->with(extra: $extra);
        }

        return $record;
    }
}
