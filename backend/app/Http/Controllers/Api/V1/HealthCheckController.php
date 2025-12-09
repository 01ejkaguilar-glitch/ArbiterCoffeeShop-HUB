<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Queue;

class HealthCheckController extends Controller
{
    /**
     * Perform comprehensive health check
     */
    public function check(Request $request)
    {
        $checks = [
            'status' => 'healthy',
            'timestamp' => now()->toISOString(),
            'version' => config('app.version', '1.0.0'),
            'environment' => config('app.env'),
            'services' => [],
            'metrics' => [],
        ];

        // Database check
        $checks['services']['database'] = $this->checkDatabase();

        // Cache check
        $checks['services']['cache'] = $this->checkCache();

        // Storage check
        $checks['services']['storage'] = $this->checkStorage();

        // Queue check
        $checks['services']['queue'] = $this->checkQueue();

        // Performance metrics
        $checks['metrics'] = $this->getMetrics();

        // Determine overall status
        $hasErrors = collect($checks['services'])->contains(function ($service) {
            return $service['status'] !== 'ok';
        });

        $checks['status'] = $hasErrors ? 'unhealthy' : 'healthy';

        return response()->json($checks, $hasErrors ? 503 : 200);
    }

    /**
     * Check database connectivity
     */
    private function checkDatabase(): array
    {
        try {
            $start = microtime(true);
            DB::select('SELECT 1');
            $duration = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => 'ok',
                'response_time_ms' => $duration,
                'message' => 'Database connection successful'
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Database connection failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Check cache connectivity
     */
    private function checkCache(): array
    {
        try {
            $start = microtime(true);
            Cache::store()->put('health_check', 'ok', 10);
            $value = Cache::store()->get('health_check');
            $duration = round((microtime(true) - $start) * 1000, 2);

            if ($value === 'ok') {
                return [
                    'status' => 'ok',
                    'response_time_ms' => $duration,
                    'message' => 'Cache is working properly'
                ];
            } else {
                return [
                    'status' => 'error',
                    'message' => 'Cache read/write test failed'
                ];
            }
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Cache connection failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Check storage connectivity
     */
    private function checkStorage(): array
    {
        try {
            $disk = config('filesystems.default');
            $testFile = 'health_check_' . time() . '.txt';
            $content = 'health_check_' . now()->toISOString();

            Storage::disk($disk)->put($testFile, $content);
            $readContent = Storage::disk($disk)->get($testFile);
            Storage::disk($disk)->delete($testFile);

            if ($readContent === $content) {
                return [
                    'status' => 'ok',
                    'disk' => $disk,
                    'message' => 'Storage is working properly'
                ];
            } else {
                return [
                    'status' => 'error',
                    'disk' => $disk,
                    'message' => 'Storage read/write test failed'
                ];
            }
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'disk' => config('filesystems.default'),
                'message' => 'Storage connection failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Check queue connectivity
     */
    private function checkQueue(): array
    {
        try {
            $size = Queue::size();
            return [
                'status' => 'ok',
                'queue_size' => $size,
                'message' => 'Queue connection successful'
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Queue connection failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get system metrics
     */
    private function getMetrics(): array
    {
        return [
            'memory_usage_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
            'uptime_seconds' => time() - ($_SERVER['REQUEST_TIME'] ?? time()),
            'active_connections' => $this->getActiveConnections(),
            'cache_hit_rate' => $this->getCacheHitRate(),
        ];
    }

    /**
     * Get active database connections (approximate)
     */
    private function getActiveConnections(): int
    {
        try {
            $result = DB::select("SHOW PROCESSLIST");
            return count($result);
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Get cache hit rate (simplified)
     */
    private function getCacheHitRate(): float
    {
        // This is a simplified implementation
        // In production, you'd track this with a proper monitoring system
        return 95.5; // Placeholder
    }
}
