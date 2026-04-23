<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cart items: queried by cart_id and product_id
        Schema::table('cart_items', function (Blueprint $table) {
//         $table->index('cart_id');
//            $table->index('product_id');
        });

        // Carts: queried by user_id
        Schema::table('carts', function (Blueprint $table) {
//            $table->index('user_id');
        });

        // Shifts: queried by employee_id and date ranges
//        Schema::table('shifts', function (Blueprint $table) {
//            $table->index('employee_id');
//            $table->index('date');
//            $table->index(['employee_id', 'date']);
//        });

        // Tasks: queried by assigned_to, status, priority, due_date
//        Schema::table('tasks', function (Blueprint $table) {
//            $table->index('assigned_to');
//            $table->index('status');
//            $table->index('due_date');
//            $table->index(['status', 'due_date']);
//        });

        // Employees: filtered by status, position, department
//        Schema::table('employees', function (Blueprint $table) {
//            $table->index('status');
//           $table->index('position');
//        });

        // Orders: composite indexes for common query patterns
//        Schema::table('orders', function (Blueprint $table) {
//            $table->index('payment_status');
//            $table->index(['status', 'created_at']);
//            $table->index(['user_id', 'created_at']);
//        });

        // Leave requests: queried by employee_id and status
//        Schema::table('leave_requests', function (Blueprint $table) {
//            $table->index('employee_id');
//            $table->index('status');
//        });
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropIndex(['cart_id']);
            $table->dropIndex(['product_id']);
        });

        Schema::table('carts', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });

        Schema::table('shifts', function (Blueprint $table) {
            $table->dropIndex(['employee_id']);
            $table->dropIndex(['date']);
            $table->dropIndex(['employee_id', 'date']);
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['assigned_to']);
            $table->dropIndex(['status']);
            $table->dropIndex(['due_date']);
            $table->dropIndex(['status', 'due_date']);
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['position']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['payment_status']);
            $table->dropIndex(['status', 'created_at']);
            $table->dropIndex(['user_id', 'created_at']);
        });

        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropIndex(['employee_id']);
            $table->dropIndex(['status']);
        });
    }
};
