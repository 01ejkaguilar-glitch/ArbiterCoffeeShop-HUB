<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class GenerateMonitoringReport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'monitoring:report {--period=24 : Period in hours to analyze} {--send-email : Send report via email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate comprehensive monitoring report from logs and system metrics';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $period = (int) $this->option('period');
        $sendEmail = $this->option('send-email');

        $this->info("Generating monitoring report for the last {$period} hours...");

        $report = $this->generateReport($period);

        // Display report
        $this->displayReport($report);

        // Save report to file
        $this->saveReport($report, $period);

        // Send email if requested
        if ($sendEmail) {
            $this->sendReportEmail($report, $period);
        }

        $this->info('Monitoring report generated successfully!');
    }

    /**
     * Generate comprehensive monitoring report
     */
    private function generateReport(int $period): array
    {
        $startTime = Carbon::now()->subHours($period);

        return [
            'period' => [
                'hours' => $period,
                'start' => $startTime->toDateTimeString(),
                'end' => now()->toDateTimeString(),
            ],
            'system' => $this->getSystemMetrics(),
            'api' => $this->getApiMetrics($startTime),
            'errors' => $this->getErrorMetrics($startTime),
            'security' => $this->getSecurityMetrics($startTime),
            'performance' => $this->getPerformanceMetrics($startTime),
            'business' => $this->getBusinessMetrics($startTime),
        ];
    }

    /**
     * Get system-level metrics
     */
    private function getSystemMetrics(): array
    {
        return [
            'server_load' => $this->getServerLoad(),
            'memory_usage' => [
                'current' => memory_get_usage(true),
                'peak' => memory_get_peak_usage(true),
                'limit' => ini_get('memory_limit'),
            ],
            'disk_usage' => $this->getDiskUsage(),
            'database_connections' => $this->getDatabaseConnections(),
            'cache_status' => $this->getCacheStatus(),
        ];
    }

    /**
     * Get API performance metrics
     */
    private function getApiMetrics(Carbon $startTime): array
    {
        $logFile = storage_path('logs/api.log');

        if (!file_exists($logFile)) {
            return ['error' => 'API log file not found'];
        }

        $logs = $this->parseLogFile($logFile, $startTime);

        return [
            'total_requests' => count($logs),
            'requests_by_method' => $this->groupByField($logs, 'method'),
            'requests_by_status' => $this->groupByField($logs, 'status_code'),
            'slow_requests' => array_filter($logs, fn($log) => ($log['execution_time_ms'] ?? 0) > 2000),
            'avg_response_time' => $this->calculateAverage($logs, 'execution_time_ms'),
            'error_rate' => $this->calculateErrorRate($logs),
        ];
    }

    /**
     * Get error metrics
     */
    private function getErrorMetrics(Carbon $startTime): array
    {
        $errorLog = storage_path('logs/errors.log');

        if (!file_exists($errorLog)) {
            return ['error' => 'Error log file not found'];
        }

        $logs = $this->parseLogFile($errorLog, $startTime);

        return [
            'total_errors' => count($logs),
            'errors_by_type' => $this->groupByField($logs, 'exception_class'),
            'errors_by_severity' => $this->groupByField($logs, 'severity'),
            'critical_errors' => array_filter($logs, fn($log) => ($log['severity'] ?? '') === 'critical'),
            'most_common_errors' => $this->getMostCommon($logs, 'message', 5),
        ];
    }

    /**
     * Get security metrics
     */
    private function getSecurityMetrics(Carbon $startTime): array
    {
        $securityLog = storage_path('logs/security.log');

        if (!file_exists($securityLog)) {
            return ['error' => 'Security log file not found'];
        }

        $logs = $this->parseLogFile($securityLog, $startTime);

        return [
            'total_events' => count($logs),
            'events_by_type' => $this->groupByField($logs, 'event_type'),
            'failed_auth_attempts' => array_filter($logs, fn($log) => ($log['event_type'] ?? '') === 'auth_failure'),
            'rate_limit_hits' => array_filter($logs, fn($log) => ($log['event_type'] ?? '') === 'rate_limit'),
            'suspicious_ips' => $this->getMostCommon($logs, 'ip', 10),
        ];
    }

    /**
     * Get performance metrics
     */
    private function getPerformanceMetrics(Carbon $startTime): array
    {
        $performanceLog = storage_path('logs/performance.log');

        if (!file_exists($performanceLog)) {
            return ['error' => 'Performance log file not found'];
        }

        $logs = $this->parseLogFile($performanceLog, $startTime);

        return [
            'total_requests' => count($logs),
            'avg_response_time' => $this->calculateAverage($logs, 'execution_time_ms'),
            'slow_requests_count' => count(array_filter($logs, fn($log) => ($log['execution_time_ms'] ?? 0) > 2000)),
            'high_memory_usage' => count(array_filter($logs, fn($log) => ($log['memory_kb'] ?? 0) > 50 * 1024)),
            'performance_trends' => $this->analyzePerformanceTrends($logs),
        ];
    }

    /**
     * Get business metrics
     */
    private function getBusinessMetrics(Carbon $startTime): array
    {
        $businessLog = storage_path('logs/business.log');

        if (!file_exists($businessLog)) {
            return ['error' => 'Business log file not found'];
        }

        $logs = $this->parseLogFile($businessLog, $startTime);

        return [
            'total_events' => count($logs),
            'events_by_type' => $this->groupByField($logs, 'error_type'),
            'business_errors' => array_filter($logs, fn($log) => ($log['error_type'] ?? '') === 'business_logic'),
            'most_common_business_errors' => $this->getMostCommon($logs, 'message', 5),
        ];
    }

    /**
     * Get server load (cross-platform)
     */
    private function getServerLoad(): array
    {
        if (function_exists('sys_getloadavg')) {
            return sys_getloadavg();
        }

        // Windows fallback - return CPU usage approximation
        try {
            $cpuUsage = $this->getWindowsCpuUsage();
            return [$cpuUsage, $cpuUsage, $cpuUsage]; // Return as array like sys_getloadavg
        } catch (\Exception $e) {
            return [0, 0, 0]; // Fallback
        }
    }

    /**
     * Get CPU usage on Windows
     */
    private function getWindowsCpuUsage(): float
    {
        try {
            // Try using PowerShell to get CPU usage
            $output = shell_exec('powershell -Command "Get-Counter \'\\Processor(_Total)\\% Processor Time\' | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue" 2>nul');
            if ($output && is_numeric(trim($output))) {
                return (float) trim($output) / 100;
            }
        } catch (\Exception $e) {
            // Fallback
        }

        // If PowerShell fails, return a default value
        return 0.5; // Assume 50% CPU usage as fallback
    }
    private function getDiskUsage(): array
    {
        $diskTotal = disk_total_space('/');
        $diskFree = disk_free_space('/');

        return [
            'total' => $diskTotal,
            'free' => $diskFree,
            'used' => $diskTotal - $diskFree,
            'used_percentage' => round((($diskTotal - $diskFree) / $diskTotal) * 100, 2),
        ];
    }

    private function getDatabaseConnections(): array
    {
        try {
            $result = DB::select('SHOW PROCESSLIST');
            return [
                'active_connections' => count($result),
                'status' => 'ok',
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }

    private function getCacheStatus(): array
    {
        try {
            $testKey = 'health_check_' . time();
            cache()->put($testKey, 'ok', 10);
            $value = cache()->get($testKey);
            cache()->forget($testKey);

            return [
                'status' => $value === 'ok' ? 'healthy' : 'unhealthy',
                'driver' => config('cache.default'),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }

    private function parseLogFile(string $filePath, Carbon $startTime): array
    {
        if (!file_exists($filePath)) {
            return [];
        }

        $logs = [];
        $handle = fopen($filePath, 'r');

        if ($handle) {
            while (($line = fgets($handle)) !== false) {
                $logEntry = json_decode($line, true);
                if ($logEntry && isset($logEntry['timestamp'])) {
                    $logTime = Carbon::parse($logEntry['timestamp']);
                    if ($logTime->gte($startTime)) {
                        $logs[] = $logEntry;
                    }
                }
            }
            fclose($handle);
        }

        return $logs;
    }

    private function groupByField(array $logs, string $field): array
    {
        $grouped = [];
        foreach ($logs as $log) {
            $key = $log[$field] ?? 'unknown';
            $grouped[$key] = ($grouped[$key] ?? 0) + 1;
        }
        arsort($grouped);
        return $grouped;
    }

    private function calculateAverage(array $logs, string $field): float
    {
        $values = array_filter(array_column($logs, $field));
        return $values ? array_sum($values) / count($values) : 0;
    }

    private function calculateErrorRate(array $logs): float
    {
        if (empty($logs)) return 0;

        $errors = array_filter($logs, fn($log) => ($log['status_code'] ?? 0) >= 400);
        return round((count($errors) / count($logs)) * 100, 2);
    }

    private function getMostCommon(array $logs, string $field, int $limit = 5): array
    {
        $grouped = $this->groupByField($logs, $field);
        return array_slice($grouped, 0, $limit, true);
    }

    private function analyzePerformanceTrends(array $logs): array
    {
        // Simple trend analysis - could be enhanced with more sophisticated algorithms
        $recent = array_slice($logs, -100); // Last 100 requests
        $avgRecent = $this->calculateAverage($recent, 'execution_time_ms');

        $older = array_slice($logs, 0, max(0, count($logs) - 100));
        $avgOlder = $this->calculateAverage($older, 'execution_time_ms');

        $trend = 'stable';
        if ($avgRecent > $avgOlder * 1.2) {
            $trend = 'degrading';
        } elseif ($avgRecent < $avgOlder * 0.8) {
            $trend = 'improving';
        }

        return [
            'trend' => $trend,
            'avg_recent' => round($avgRecent, 2),
            'avg_older' => round($avgOlder, 2),
            'change_percentage' => $avgOlder > 0 ? round((($avgRecent - $avgOlder) / $avgOlder) * 100, 2) : 0,
        ];
    }

    /**
     * Display report in console
     */
    private function displayReport(array $report): void
    {
        $this->info('=== MONITORING REPORT ===');
        $this->line("Period: {$report['period']['start']} to {$report['period']['end']}");
        $this->newLine();

        // System metrics
        $this->info('System Metrics:');
        $this->line("  Memory Usage: " . $this->formatBytes($report['system']['memory_usage']['current']));
        $this->line("  Disk Usage: {$report['system']['disk_usage']['used_percentage']}%");
        $this->newLine();

        // API metrics
        $this->info('API Metrics:');
        if (isset($report['api']['error'])) {
            $this->line("  Status: {$report['api']['error']}");
        } else {
            $this->line("  Total Requests: {$report['api']['total_requests']}");
            $this->line("  Average Response Time: {$report['api']['avg_response_time']}ms");
            $this->line("  Error Rate: {$report['api']['error_rate']}%");
        }
        $this->newLine();

        // Error metrics
        $this->info('Error Metrics:');
        if (isset($report['errors']['error'])) {
            $this->line("  Status: {$report['errors']['error']}");
        } else {
            $this->line("  Total Errors: {$report['errors']['total_errors']}");
            $this->line("  Critical Errors: " . count($report['errors']['critical_errors']));
        }
        $this->newLine();

        // Security metrics
        $this->info('Security Metrics:');
        if (isset($report['security']['error'])) {
            $this->line("  Status: {$report['security']['error']}");
        } else {
            $this->line("  Security Events: {$report['security']['total_events']}");
            $this->line("  Failed Auth Attempts: " . count($report['security']['failed_auth_attempts']));
        }
        $this->newLine();
    }

    /**
     * Save report to file
     */
    private function saveReport(array $report, int $period): void
    {
        $filename = "monitoring-report-" . now()->format('Y-m-d-H-i-s') . ".json";
        $path = storage_path("reports/{$filename}");

        // Ensure reports directory exists
        Storage::makeDirectory('reports');

        Storage::put("reports/{$filename}", json_encode($report, JSON_PRETTY_PRINT));

        $this->info("Report saved to: storage/reports/{$filename}");
    }

    /**
     * Send report via email
     */
    private function sendReportEmail(array $report, int $period): void
    {
        // This would send the report to administrators
        // Implementation depends on your email setup
        $this->info('Email sending not implemented yet. Report saved to file.');
    }

    /**
     * Format bytes for display
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }
}
