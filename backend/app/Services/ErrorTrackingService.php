<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Throwable;

class ErrorTrackingService
{
    /**
     * Log an exception with full context
     */
    public function logException(Throwable $exception, ?Request $request = null, array $additionalContext = []): void
    {
        $context = $this->buildExceptionContext($exception, $request, $additionalContext);

        // Log to errors channel
        Log::channel('errors')->error('Exception occurred', $context);

        // Send critical error notifications
        if ($this->isCriticalException($exception)) {
            $this->sendCriticalErrorNotification($exception, $context);
        }

        // Log critical errors to main log as well
        if ($this->isCriticalException($exception)) {
            Log::critical('Critical exception occurred', $context);
        }
    }

    /**
     * Log a business logic error
     */
    public function logBusinessError(string $message, array $context = [], ?Request $request = null): void
    {
        $fullContext = array_merge($context, [
            'error_type' => 'business_logic',
            'severity' => $context['severity'] ?? 'medium',
            'request_id' => $request ? $request->header('X-Request-ID') : null,
            'user_id' => $request ? $request->user()?->id : null,
            'url' => $request ? $request->fullUrl() : null,
            'ip' => $request ? $request->ip() : null,
        ]);

        Log::channel('business')->error($message, $fullContext);
    }

    /**
     * Log a security event
     */
    public function logSecurityEvent(string $event, array $context = [], ?Request $request = null): void
    {
        $fullContext = array_merge($context, [
            'event_type' => $event,
            'severity' => $context['severity'] ?? 'medium',
            'request_id' => $request ? $request->header('X-Request-ID') : null,
            'user_id' => $request ? $request->user()?->id : null,
            'ip' => $request ? $request->ip() : null,
            'user_agent' => $request ? $request->userAgent() : null,
            'timestamp' => now()->toISOString(),
        ]);

        Log::channel('security')->warning("Security Event: {$event}", $fullContext);
    }

    /**
     * Log API errors with structured data
     */
    public function logApiError(string $message, int $statusCode, array $context = [], ?Request $request = null): void
    {
        $fullContext = array_merge($context, [
            'status_code' => $statusCode,
            'error_type' => 'api_error',
            'severity' => $this->getSeverityFromStatusCode($statusCode),
            'request_id' => $request ? $request->header('X-Request-ID') : null,
            'user_id' => $request ? $request->user()?->id : null,
            'method' => $request ? $request->method() : null,
            'url' => $request ? $request->fullUrl() : null,
            'ip' => $request ? $request->ip() : null,
        ]);

        $channel = $statusCode >= 500 ? 'errors' : 'api';
        $level = $statusCode >= 500 ? 'error' : 'warning';

        Log::channel($channel)->$level($message, $fullContext);
    }

    /**
     * Build comprehensive exception context
     */
    private function buildExceptionContext(Throwable $exception, ?Request $request = null, array $additionalContext = []): array
    {
        $context = [
            'exception_class' => get_class($exception),
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'code' => $exception->getCode(),
            'trace' => $exception->getTraceAsString(),
            'severity' => $this->getExceptionSeverity($exception),
            'request_id' => $request ? $request->header('X-Request-ID') : null,
            'user_id' => $request ? $request->user()?->id : null,
            'url' => $request ? $request->fullUrl() : null,
            'method' => $request ? $request->method() : null,
            'ip' => $request ? $request->ip() : null,
            'user_agent' => $request ? $request->userAgent() : null,
            'headers' => $request ? $this->sanitizeHeaders($request->header()) : null,
            'input' => $request ? $this->sanitizeInput($request->all()) : null,
            'session' => $request && $request->hasSession() ? $request->session()->all() : null,
            'server_memory' => [
                'peak_usage' => memory_get_peak_usage(true),
                'current_usage' => memory_get_usage(true),
            ],
            'timestamp' => now()->toISOString(),
        ];

        return array_merge($context, $additionalContext);
    }

    /**
     * Determine if an exception is critical
     */
    private function isCriticalException(Throwable $exception): bool
    {
        $criticalExceptions = [
            'PDOException',
            'Illuminate\Database\QueryException',
            'Illuminate\Encryption\MissingAppKeyException',
            'Illuminate\Queue\MaxAttemptsExceededException',
        ];

        return in_array(get_class($exception), $criticalExceptions) ||
            str_contains($exception->getMessage(), 'production') ||
            $exception->getCode() >= 500;
    }

    /**
     * Get severity level from HTTP status code
     */
    private function getSeverityFromStatusCode(int $statusCode): string
    {
        if ($statusCode >= 500) {
            return 'high';
        } elseif ($statusCode >= 400) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Get severity level from exception type
     */
    private function getExceptionSeverity(Throwable $exception): string
    {
        if ($this->isCriticalException($exception)) {
            return 'critical';
        }

        $warningExceptions = [
            'Illuminate\Validation\ValidationException',
            'Illuminate\Auth\AuthenticationException',
            'Illuminate\Auth\Access\AuthorizationException',
        ];

        if (in_array(get_class($exception), $warningExceptions)) {
            return 'medium';
        }

        return 'high';
    }

    /**
     * Sanitize headers to remove sensitive information
     */
    private function sanitizeHeaders(array $headers): array
    {
        $sensitiveHeaders = [
            'authorization',
            'x-api-key',
            'x-auth-token',
            'cookie',
            'x-csrf-token',
        ];

        $sanitized = [];
        foreach ($headers as $key => $value) {
            if (in_array(strtolower($key), $sensitiveHeaders)) {
                $sanitized[$key] = '[REDACTED]';
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    /**
     * Sanitize input data to remove sensitive information
     */
    private function sanitizeInput(array $input): array
    {
        $sensitiveFields = [
            'password',
            'password_confirmation',
            'current_password',
            'token',
            'api_key',
            'secret',
            'credit_card',
            'card_number',
            'cvv',
            'pin',
        ];

        $sanitized = [];
        foreach ($input as $key => $value) {
            if (in_array(strtolower($key), $sensitiveFields)) {
                $sanitized[$key] = '[REDACTED]';
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    /**
     * Send critical error notification
     */
    private function sendCriticalErrorNotification(Throwable $exception, array $context): void
    {
        // Only send notifications in production or staging
        if (!in_array(config('app.env'), ['production', 'staging'])) {
            return;
        }

        // Get admin users to notify
        $adminUsers = \App\Models\User::role(['admin', 'super-admin'])->get();

        if ($adminUsers->isEmpty()) {
            Log::channel('errors')->warning('No admin users found to notify about critical error');
            return;
        }

        // Send notification to all admin users
        foreach ($adminUsers as $admin) {
            try {
                $admin->notify(new \App\Notifications\CriticalErrorNotification($exception, $context));
            } catch (Throwable $notificationException) {
                // Log notification failure but don't let it break the error handling
                Log::channel('errors')->error('Failed to send critical error notification', [
                    'admin_id' => $admin->id,
                    'admin_email' => $admin->email,
                    'notification_error' => $notificationException->getMessage(),
                ]);
            }
        }

        Log::channel('errors')->info('Critical error notifications sent', [
            'admin_count' => $adminUsers->count(),
            'exception_class' => get_class($exception),
        ]);
    }
}
