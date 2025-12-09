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
        Schema::create('coffee_beans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('origin_country');
            $table->string('region')->nullable();
            $table->string('elevation')->nullable();
            $table->string('processing_method')->nullable();
            $table->string('variety')->nullable();
            $table->text('tasting_notes')->nullable();
            $table->string('producer')->nullable();
            $table->integer('stock_quantity')->default(0);
            $table->boolean('is_featured')->default(false);
            $table->string('image_url')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('is_featured');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coffee_beans');
    }
};
