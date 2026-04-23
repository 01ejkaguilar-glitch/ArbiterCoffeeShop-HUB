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
        Schema::create('daily_featured_origins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coffee_bean_id')->constrained()->onDelete('cascade');
            $table->date('feature_date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->text('special_notes')->nullable();
            $table->text('promotion_text')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['feature_date', 'is_active']);
            $table->unique(['coffee_bean_id', 'feature_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_featured_origins');
    }
};
