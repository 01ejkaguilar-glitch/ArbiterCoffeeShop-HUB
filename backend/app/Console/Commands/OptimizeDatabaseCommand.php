<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class OptimizeDatabaseCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:optimize {--analyze : Analyze tables for optimization}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Optimize database tables and analyze query performance';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting database optimization...');

        $tables = $this->getTables();

        if ($this->option('analyze')) {
            $this->analyzeTables($tables);
        }

        $this->optimizeTables($tables);
        $this->checkIndexes();
        $this->generateOptimizationReport();

        $this->info('Database optimization completed!');
    }

    /**
     * Get all tables in the database
     */
    protected function getTables(): array
    {
        $tables = DB::select('SHOW TABLES');
        $dbName = env('DB_DATABASE');
        $tableKey = "Tables_in_{$dbName}";

        return array_map(function ($table) use ($tableKey) {
            return $table->$tableKey;
        }, $tables);
    }

    /**
     * Analyze tables
     */
    protected function analyzeTables(array $tables): void
    {
        $this->info('Analyzing tables...');

        foreach ($tables as $table) {
            DB::statement("ANALYZE TABLE {$table}");
            $this->line("  ✓ Analyzed: {$table}");
        }
    }

    /**
     * Optimize tables
     */
    protected function optimizeTables(array $tables): void
    {
        $this->info('Optimizing tables...');

        foreach ($tables as $table) {
            DB::statement("OPTIMIZE TABLE {$table}");
            $this->line("  ✓ Optimized: {$table}");
        }
    }

    /**
     * Check and suggest missing indexes
     */
    protected function checkIndexes(): void
    {
        $this->info('Checking indexes...');

        $suggestions = [
            'orders' => [
                'status' => 'CREATE INDEX idx_orders_status ON orders(status);',
                'created_at' => 'CREATE INDEX idx_orders_created_at ON orders(created_at);',
                'user_id_status' => 'CREATE INDEX idx_orders_user_status ON orders(user_id, status);',
            ],
            'order_items' => [
                'order_id' => 'CREATE INDEX idx_order_items_order_id ON order_items(order_id);',
                'product_id' => 'CREATE INDEX idx_order_items_product_id ON order_items(product_id);',
            ],
            'products' => [
                'category_id' => 'CREATE INDEX idx_products_category_id ON products(category_id);',
                'is_available' => 'CREATE INDEX idx_products_is_available ON products(is_available);',
            ],
            'employees' => [
                'user_id' => 'CREATE INDEX idx_employees_user_id ON employees(user_id);',
                'status' => 'CREATE INDEX idx_employees_status ON employees(status);',
            ],
        ];

        foreach ($suggestions as $table => $indexes) {
            $existingIndexes = $this->getTableIndexes($table);
            
            foreach ($indexes as $indexName => $sql) {
                if (!in_array($indexName, $existingIndexes)) {
                    $this->warn("  Missing index on {$table}: {$indexName}");
                    $this->line("    Suggestion: {$sql}");
                }
            }
        }
    }

    /**
     * Get existing indexes for a table
     */
    protected function getTableIndexes(string $table): array
    {
        try {
            $indexes = DB::select("SHOW INDEX FROM {$table}");
            return array_map(function ($index) {
                return $index->Key_name;
            }, $indexes);
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Generate optimization report
     */
    protected function generateOptimizationReport(): void
    {
        $this->info('Generating optimization report...');

        // Get slow query log status
        $slowQueryLog = DB::select("SHOW VARIABLES LIKE 'slow_query_log'");
        $slowQueryLogStatus = $slowQueryLog[0]->Value ?? 'OFF';

        // Get table statistics
        $stats = [];
        foreach ($this->getTables() as $table) {
            $tableStats = DB::select("SHOW TABLE STATUS LIKE '{$table}'");
            if (!empty($tableStats)) {
                $stats[$table] = [
                    'rows' => $tableStats[0]->Rows ?? 0,
                    'data_size' => $this->formatBytes($tableStats[0]->Data_length ?? 0),
                    'index_size' => $this->formatBytes($tableStats[0]->Index_length ?? 0),
                ];
            }
        }

        $report = [
            'timestamp' => now()->toDateTimeString(),
            'slow_query_log' => $slowQueryLogStatus,
            'table_statistics' => $stats,
            'recommendations' => [
                'Enable slow query log for production monitoring',
                'Consider partitioning large tables (>1M rows)',
                'Regularly run ANALYZE TABLE on frequently updated tables',
                'Monitor and optimize queries taking >100ms',
            ],
        ];

        $reportPath = storage_path('logs/database-optimization-report.json');
        file_put_contents($reportPath, json_encode($report, JSON_PRETTY_PRINT));

        $this->info("Report saved to: {$reportPath}");
    }

    /**
     * Format bytes to human-readable format
     */
    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));

        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
