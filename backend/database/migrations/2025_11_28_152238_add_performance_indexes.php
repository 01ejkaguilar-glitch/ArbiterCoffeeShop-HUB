<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Check if index exists (SQLite compatible)
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $result = DB::select("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name=? AND name=?", [$table, $indexName]);
        return !empty($result);
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Orders table indexes - Only add composite indexes not already present
        Schema::table('orders', function (Blueprint $table) {
            // Check if indexes exist before adding them
            if (!$this->indexExists('orders', 'idx_orders_status_created')) {
                $table->index(['status', 'created_at'], 'idx_orders_status_created');
            }

            if (!$this->indexExists('orders', 'idx_orders_payment_status_created')) {
                $table->index(['payment_status', 'created_at'], 'idx_orders_payment_status_created');
            }

            if (!$this->indexExists('orders', 'idx_orders_updated_at')) {
                $table->index('updated_at', 'idx_orders_updated_at');
            }
        });

        // Order items table indexes
        Schema::table('order_items', function (Blueprint $table) {
            if (!$this->indexExists('order_items', 'idx_order_items_order_id')) {
                $table->index('order_id', 'idx_order_items_order_id');
            }

            if (!$this->indexExists('order_items', 'idx_order_items_product_order')) {
                $table->index(['product_id', 'order_id'], 'idx_order_items_product_order');
            }
        });

        // Products table indexes
        Schema::table('products', function (Blueprint $table) {
            if (!$this->indexExists('products', 'idx_products_category_available')) {
                $table->index(['category_id', 'is_available'], 'idx_products_category_available');
            }

            if (!$this->indexExists('products', 'idx_products_price')) {
                $table->index('price', 'idx_products_price');
            }

            if (!$this->indexExists('products', 'idx_products_created_at')) {
                $table->index('created_at', 'idx_products_created_at');
            }
        });

        // Users table indexes
        Schema::table('users', function (Blueprint $table) {
            if (!$this->indexExists('users', 'idx_users_email')) {
                $table->index('email', 'idx_users_email');
            }

            if (!$this->indexExists('users', 'idx_users_created_at')) {
                $table->index('created_at', 'idx_users_created_at');
            }
        });

        // Attendances table indexes
        Schema::table('attendances', function (Blueprint $table) {
            if (!$this->indexExists('attendances', 'idx_attendances_user_date')) {
                $table->index(['employee_id', 'date'], 'idx_attendances_user_date');
            }

            if (!$this->indexExists('attendances', 'idx_attendances_date')) {
                $table->index('date', 'idx_attendances_date');
            }
        });

        // Tasks table indexes
        Schema::table('tasks', function (Blueprint $table) {
            if (!$this->indexExists('tasks', 'idx_tasks_assigned_status')) {
                $table->index(['assigned_to', 'status'], 'idx_tasks_assigned_status');
            }

            if (!$this->indexExists('tasks', 'idx_tasks_due_date')) {
                $table->index('due_date', 'idx_tasks_due_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes in reverse order
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex('idx_tasks_assigned_status');
            $table->dropIndex('idx_tasks_due_date');
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndex('idx_attendances_user_date');
            $table->dropIndex('idx_attendances_date');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_email');
            $table->dropIndex('idx_users_created_at');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('idx_products_category_available');
            $table->dropIndex('idx_products_price');
            $table->dropIndex('idx_products_created_at');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex('idx_order_items_order_id');
            $table->dropIndex('idx_order_items_product_order');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_status_created');
            $table->dropIndex('idx_orders_updated_at');
            $table->dropIndex('idx_orders_payment_status_created');
        });
    }
};
