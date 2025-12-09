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
        Schema::create('performance_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('reviewer_id')->constrained('users')->onDelete('cascade');
            $table->date('review_period_start');
            $table->date('review_period_end');
            $table->decimal('speed_score', 3, 2)->default(0.00); // 0.00 to 5.00
            $table->decimal('quality_score', 3, 2)->default(0.00);
            $table->decimal('attendance_score', 3, 2)->default(0.00);
            $table->decimal('teamwork_score', 3, 2)->default(0.00);
            $table->decimal('customer_service_score', 3, 2)->default(0.00);
            $table->decimal('overall_score', 3, 2)->default(0.00);
            $table->text('strengths')->nullable();
            $table->text('areas_for_improvement')->nullable();
            $table->text('goals')->nullable();
            $table->text('comments')->nullable();
            $table->timestamps();
            
            $table->index('employee_id');
            $table->index(['review_period_start', 'review_period_end']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('performance_reviews');
    }
};
