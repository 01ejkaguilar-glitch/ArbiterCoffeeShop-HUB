<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class AnalyzePerformanceCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'performance:analyze {--days=7 : Number of days to analyze}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Analyze API performance metrics from logs';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Analyzing API performance metrics...');

        $logFile = storage_path('logs/api-performance.log');

        if (!File::exists($logFile)) {
            $this->error('Performance log file not found. Make sure API requests have been logged.');
            return 1;
        }

        $logs = $this->parseLogs($logFile);

        if (empty($logs)) {
            $this->warn('No performance data found in logs.');
            return 0;
        }

        $analysis = $this->analyzeMetrics($logs);

        $this->displayAnalysis($analysis);
        $this->generateReport($analysis);

        $this->info('Analysis completed!');
        return 0;
    }

    /**
     * Parse log file
     */
    protected function parseLogs(string $logFile): array
    {
        $content = File::get($logFile);
        $lines = explode(PHP_EOL, $content);
        
        $logs = [];
        foreach ($lines as $line) {
            if (empty(trim($line))) {
                continue;
            }

            $data = json_decode($line, true);
            if ($data !== null) {
                $logs[] = $data;
            }
        }

        return $logs;
    }

    /**
     * Analyze performance metrics
     */
    protected function analyzeMetrics(array $logs): array
    {
        $totalRequests = count($logs);
        $responseTimes = array_column($logs, 'execution_time_ms');
        $memoryUsages = array_column($logs, 'memory_mb');

        // Group by endpoint
        $endpoints = [];
        foreach ($logs as $log) {
            $endpoint = $log['endpoint'] ?? 'unknown';
            if (!isset($endpoints[$endpoint])) {
                $endpoints[$endpoint] = [
                    'count' => 0,
                    'times' => [],
                    'memory' => [],
                    'errors' => 0,
                ];
            }

            $endpoints[$endpoint]['count']++;
            $endpoints[$endpoint]['times'][] = $log['execution_time_ms'];
            $endpoints[$endpoint]['memory'][] = $log['memory_mb'];

            if (($log['status_code'] ?? 200) >= 400) {
                $endpoints[$endpoint]['errors']++;
            }
        }

        // Calculate statistics for each endpoint
        $endpointStats = [];
        foreach ($endpoints as $endpoint => $data) {
            $endpointStats[$endpoint] = [
                'requests' => $data['count'],
                'avg_time' => round(array_sum($data['times']) / $data['count'], 2),
                'min_time' => round(min($data['times']), 2),
                'max_time' => round(max($data['times']), 2),
                'avg_memory' => round(array_sum($data['memory']) / $data['count'], 2),
                'error_rate' => round(($data['errors'] / $data['count']) * 100, 2),
            ];
        }

        // Sort by avg response time (slowest first)
        uasort($endpointStats, function ($a, $b) {
            return $b['avg_time'] <=> $a['avg_time'];
        });

        return [
            'summary' => [
                'total_requests' => $totalRequests,
                'avg_response_time' => round(array_sum($responseTimes) / $totalRequests, 2),
                'min_response_time' => round(min($responseTimes), 2),
                'max_response_time' => round(max($responseTimes), 2),
                'p95_response_time' => $this->percentile($responseTimes, 95),
                'p99_response_time' => $this->percentile($responseTimes, 99),
                'avg_memory_usage' => round(array_sum($memoryUsages) / $totalRequests, 2),
                'slow_requests' => count(array_filter($responseTimes, fn($t) => $t > 200)),
            ],
            'endpoints' => $endpointStats,
        ];
    }

    /**
     * Calculate percentile
     */
    protected function percentile(array $data, int $percentile): float
    {
        sort($data);
        $index = (count($data) - 1) * ($percentile / 100);
        $lower = floor($index);
        $upper = ceil($index);
        $weight = $index - $lower;

        return round($data[$lower] * (1 - $weight) + $data[$upper] * $weight, 2);
    }

    /**
     * Display analysis results
     */
    protected function displayAnalysis(array $analysis): void
    {
        $this->newLine();
        $this->info('=== PERFORMANCE SUMMARY ===');
        $this->table(
            ['Metric', 'Value'],
            [
                ['Total Requests', number_format($analysis['summary']['total_requests'])],
                ['Avg Response Time', $analysis['summary']['avg_response_time'] . 'ms'],
                ['Min Response Time', $analysis['summary']['min_response_time'] . 'ms'],
                ['Max Response Time', $analysis['summary']['max_response_time'] . 'ms'],
                ['P95 Response Time', $analysis['summary']['p95_response_time'] . 'ms'],
                ['P99 Response Time', $analysis['summary']['p99_response_time'] . 'ms'],
                ['Avg Memory Usage', $analysis['summary']['avg_memory_usage'] . 'MB'],
                ['Slow Requests (>200ms)', $analysis['summary']['slow_requests']],
            ]
        );

        $this->newLine();
        $this->info('=== TOP 10 SLOWEST ENDPOINTS ===');
        
        $topEndpoints = array_slice($analysis['endpoints'], 0, 10, true);
        $tableData = [];
        
        foreach ($topEndpoints as $endpoint => $stats) {
            $tableData[] = [
                $endpoint,
                number_format($stats['requests']),
                $stats['avg_time'] . 'ms',
                $stats['max_time'] . 'ms',
                $stats['avg_memory'] . 'MB',
                $stats['error_rate'] . '%',
            ];
        }

        $this->table(
            ['Endpoint', 'Requests', 'Avg Time', 'Max Time', 'Avg Memory', 'Error Rate'],
            $tableData
        );
    }

    /**
     * Generate detailed report
     */
    protected function generateReport(array $analysis): void
    {
        $reportPath = storage_path('logs/performance-analysis-report.json');
        
        $report = [
            'generated_at' => now()->toDateTimeString(),
            'analysis' => $analysis,
            'recommendations' => $this->generateRecommendations($analysis),
        ];

        File::put($reportPath, json_encode($report, JSON_PRETTY_PRINT));

        $this->newLine();
        $this->info("Detailed report saved to: {$reportPath}");
    }

    /**
     * Generate performance recommendations
     */
    protected function generateRecommendations(array $analysis): array
    {
        $recommendations = [];

        // Check avg response time
        if ($analysis['summary']['avg_response_time'] > 200) {
            $recommendations[] = [
                'priority' => 'HIGH',
                'issue' => 'Average response time exceeds 200ms',
                'recommendation' => 'Consider implementing caching, optimizing database queries, and using eager loading',
            ];
        }

        // Check slow requests
        $slowRequestPercent = ($analysis['summary']['slow_requests'] / $analysis['summary']['total_requests']) * 100;
        if ($slowRequestPercent > 10) {
            $recommendations[] = [
                'priority' => 'MEDIUM',
                'issue' => "Slow requests (>200ms) account for {$slowRequestPercent}% of total requests",
                'recommendation' => 'Identify and optimize slow endpoints, consider adding indexes to frequently queried fields',
            ];
        }

        // Check memory usage
        if ($analysis['summary']['avg_memory_usage'] > 10) {
            $recommendations[] = [
                'priority' => 'MEDIUM',
                'issue' => 'High memory usage detected',
                'recommendation' => 'Review query result sets, implement pagination, and optimize data transformations',
            ];
        }

        // Check slowest endpoints
        foreach (array_slice($analysis['endpoints'], 0, 3, true) as $endpoint => $stats) {
            if ($stats['avg_time'] > 300) {
                $recommendations[] = [
                    'priority' => 'HIGH',
                    'issue' => "Endpoint '{$endpoint}' has avg response time of {$stats['avg_time']}ms",
                    'recommendation' => 'Optimize this endpoint: review queries, add caching, or implement background processing',
                ];
            }
        }

        if (empty($recommendations)) {
            $recommendations[] = [
                'priority' => 'INFO',
                'issue' => 'No critical performance issues detected',
                'recommendation' => 'Continue monitoring and maintain current optimization practices',
            ];
        }

        return $recommendations;
    }
}
