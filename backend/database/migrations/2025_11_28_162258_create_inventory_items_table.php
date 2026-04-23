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
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['beans', 'syrup', 'milk', 'supplies', 'other']);
            $table->decimal('quantity', 10, 2)->default(0);
            $table->string('unit', 50);
            $table->decimal('reorder_level', 10, 2)->default(0);
            $table->decimal('cost_per_unit', 10, 2)->nullable();
            $table->timestamps();

            $table->index(['type', 'quantity']);
            $table->index('reorder_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
