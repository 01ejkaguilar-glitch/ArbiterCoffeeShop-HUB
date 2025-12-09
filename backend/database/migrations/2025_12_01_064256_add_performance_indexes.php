<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->index('total_amount', 'orders_total_amount_index');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->index(['order_id', 'product_id'], 'order_items_order_product_index');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index(['category_id', 'is_available'], 'products_category_available_index');
            $table->index('price', 'products_price_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_total_amount_index');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex('order_items_order_product_index');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_category_available_index');
            $table->dropIndex('products_price_index');
        });
    }
};
