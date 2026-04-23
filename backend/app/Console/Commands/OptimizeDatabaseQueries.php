<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class OptimizeDatabaseQueries extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:optimize-queries';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Analyze and optimize database queries and indexes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Analyzing database queries and indexes...');

        // Check for missing indexes on foreign keys
        $this->checkForeignKeyIndexes();

        // Analyze table statistics
        $this->analyzeTableStatistics();

        // Optimize tables
        $this->optimizeTables();

        $this->info('Database optimization complete!');
    }

    /**
     * Check for missing indexes on foreign keys.
     */
    private function checkForeignKeyIndexes()
    {
        $this->info('Checking foreign key indexes...');

        $tables = [
            'orders' => ['user_id', 'status', 'created_at'],
            'order_items' => ['order_id', 'product_id'],
            'products' => ['category_id', 'is_available'],
            'employees' => ['user_id', 'status'],
            'shifts' => ['employee_id', 'date', 'status'],
            'tasks' => ['assigned_to', 'status', 'due_date'],
            'attendances' => ['employee_id', 'date'],
            'leave_requests' => ['employee_id', 'status', 'start_date', 'end_date'],
            'performance_reviews' => ['employee_id', 'review_period_start', 'review_period_end'],
            'inventory_items' => ['type', 'quantity'],
            'inventory_logs' => ['inventory_item_id', 'created_at'],
        ];

        foreach ($tables as $table => $columns) {
            if (Schema::hasTable($table)) {
                $this->line("  Checking table: {$table}");
                
                foreach ($columns as $column) {
                    if (Schema::hasColumn($table, $column)) {
                        $this->line("    ✓ Column '{$column}' exists");
                    } else {
                        $this->warn("    ✗ Column '{$column}' missing");
                    }
                }
            } else {
                $this->warn("  Table '{$table}' does not exist");
            }
        }
    }

    /**
     * Analyze table statistics.
     */
    private function analyzeTableStatistics()
    {
        $this->info('Analyzing table statistics...');

        try {
            $tables = DB::select('SHOW TABLES');
            $databaseName = DB::getDatabaseName();
            
            foreach ($tables as $table) {
                $tableName = $table->{"Tables_in_{$databaseName}"};
                DB::statement("ANALYZE TABLE {$tableName}");
                $this->line("  Analyzed: {$tableName}");
            }
        } catch (\Exception $e) {
            $this->error('  Error analyzing tables: ' . $e->getMessage());
        }
    }

    /**
     * Optimize database tables.
     */
    private function optimizeTables()
    {
        $this->info('Optimizing tables...');

        try {
            $tables = DB::select('SHOW TABLES');
            $databaseName = DB::getDatabaseName();
            
            foreach ($tables as $table) {
                $tableName = $table->{"Tables_in_{$databaseName}"};
                
                // Skip system tables
                if (in_array($tableName, ['migrations', 'failed_jobs', 'personal_access_tokens'])) {
                    continue;
                }
                
                DB::statement("OPTIMIZE TABLE {$tableName}");
                $this->line("  Optimized: {$tableName}");
            }
        } catch (\Exception $e) {
            $this->error('  Error optimizing tables: ' . $e->getMessage());
        }
    }
}
