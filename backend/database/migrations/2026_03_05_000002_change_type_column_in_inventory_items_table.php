<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Change type from enum to varchar so it can hold bar/kitchen/packaging/cleaning/stationery
        DB::statement("ALTER TABLE inventory_items MODIFY type VARCHAR(50) NOT NULL DEFAULT 'other'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE inventory_items MODIFY type ENUM('beans','syrup','milk','supplies','other') NOT NULL DEFAULT 'other'");
    }
};
