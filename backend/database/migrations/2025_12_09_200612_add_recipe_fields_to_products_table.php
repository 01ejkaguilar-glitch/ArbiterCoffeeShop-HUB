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
        Schema::table('products', function (Blueprint $table) {
            $table->json('recipe_instructions')->nullable()->after('customization_options');
            $table->string('brewing_method')->nullable()->after('recipe_instructions');
            $table->decimal('recommended_water_temp', 5, 1)->nullable()->after('brewing_method'); // in Celsius
            $table->integer('recommended_brew_time')->nullable()->after('recommended_water_temp'); // in seconds
            $table->decimal('coffee_to_water_ratio', 4, 2)->nullable()->after('recommended_brew_time'); // e.g., 1:16
            $table->string('grind_size')->nullable()->after('coffee_to_water_ratio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'recipe_instructions',
                'brewing_method',
                'recommended_water_temp',
                'recommended_brew_time',
                'coffee_to_water_ratio',
                'grind_size',
            ]);
        });
    }
};
