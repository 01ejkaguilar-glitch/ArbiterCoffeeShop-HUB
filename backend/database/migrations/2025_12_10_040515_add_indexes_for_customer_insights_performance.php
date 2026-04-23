<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Orders table indexes for customer insights
        $this->addIndexIfNotExists('orders', 'idx_orders_user_created', function (Blueprint $table) {
            $table->index(['user_id', 'created_at'], 'idx_orders_user_created');
        });
        
        $this->addIndexIfNotExists('orders', 'idx_orders_user_status', function (Blueprint $table) {
            $table->index(['user_id', 'status'], 'idx_orders_user_status');
        });
        
        $this->addIndexIfNotExists('orders', 'idx_orders_status', function (Blueprint $table) {
            $table->index('status', 'idx_orders_status');
        });
        
        $this->addIndexIfNotExists('orders', 'idx_orders_created_at', function (Blueprint $table) {
            $table->index('created_at', 'idx_orders_created_at');
        });

        // Order items table indexes for recommendations
        $this->addIndexIfNotExists('order_items', 'idx_order_items_product', function (Blueprint $table) {
            $table->index('product_id', 'idx_order_items_product');
        });
        
        $this->addIndexIfNotExists('order_items', 'idx_order_items_order', function (Blueprint $table) {
            $table->index('order_id', 'idx_order_items_order');
        });
        
        $this->addIndexIfNotExists('order_items', 'idx_order_items_order_product', function (Blueprint $table) {
            $table->index(['order_id', 'product_id'], 'idx_order_items_order_product');
        });

        // Products table indexes
        $this->addIndexIfNotExists('products', 'idx_products_category', function (Blueprint $table) {
            $table->index('category_id', 'idx_products_category');
        });
        
        $this->addIndexIfNotExists('products', 'idx_products_available', function (Blueprint $table) {
            $table->index('is_available', 'idx_products_available');
        });
        
        $this->addIndexIfNotExists('products', 'idx_products_category_available', function (Blueprint $table) {
            $table->index(['category_id', 'is_available'], 'idx_products_category_available');
        });

        // Coffee beans table indexes
        $this->addIndexIfNotExists('coffee_beans', 'idx_coffee_beans_stock', function (Blueprint $table) {
            $table->index('stock_quantity', 'idx_coffee_beans_stock');
        });
        
        $this->addIndexIfNotExists('coffee_beans', 'idx_coffee_beans_featured', function (Blueprint $table) {
            $table->index('is_featured', 'idx_coffee_beans_featured');
        });

        // Users table indexes
        $this->addIndexIfNotExists('users', 'idx_users_created_at', function (Blueprint $table) {
            $table->index('created_at', 'idx_users_created_at');
        });
    }
    
    /**
     * Add index if it doesn't exist
     */
    private function addIndexIfNotExists(string $tableName, string $indexName, callable $callback): void
    {
        if (!$this->indexExists($tableName, $indexName)) {
            Schema::table($tableName, $callback);
        }
    }
    
    /**
     * Check if index exists
     */
    private function indexExists(string $tableName, string $indexName): bool
    {
        $indexes = DB::select("SHOW INDEX FROM {$tableName} WHERE Key_name = ?", [$indexName]);
        return !empty($indexes);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes from orders
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_user_created');
            $table->dropIndex('idx_orders_user_status');
            $table->dropIndex('idx_orders_status');
            $table->dropIndex('idx_orders_created_at');
        });

        // Drop indexes from order_items
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex('idx_order_items_product');
            $table->dropIndex('idx_order_items_order');
            $table->dropIndex('idx_order_items_order_product');
        });

        // Drop indexes from products
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('idx_products_category');
            $table->dropIndex('idx_products_available');
            $table->dropIndex('idx_products_category_available');
        });

        // Drop indexes from coffee_beans
        Schema::table('coffee_beans', function (Blueprint $table) {
            $table->dropIndex('idx_coffee_beans_stock');
            $table->dropIndex('idx_coffee_beans_featured');
        });

        // Drop indexes from users
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_created_at');
        });
    }
};
