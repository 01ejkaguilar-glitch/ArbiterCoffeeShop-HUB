<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            $this->rebuildInventoryItemsForSqlite();
            return;
        }

        // Change type from enum to varchar so it can hold bar/kitchen/packaging/cleaning/stationery
        DB::statement("ALTER TABLE inventory_items MODIFY type VARCHAR(50) NOT NULL DEFAULT 'other'");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE inventory_items MODIFY type ENUM('beans','syrup','milk','supplies','other') NOT NULL DEFAULT 'other'");
    }

    /**
     * SQLite cannot alter enum/check constraints in place.
     * Rebuild the table with a plain string type column.
     */
    private function rebuildInventoryItemsForSqlite(): void
    {
        DB::statement('PRAGMA foreign_keys=OFF');

        Schema::create('inventory_items_new', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category')->nullable();
            $table->string('source')->nullable();
            $table->string('type', 50)->default('other');
            $table->decimal('quantity', 10, 2)->default(0);
            $table->string('unit', 50);
            $table->decimal('reorder_level', 10, 2)->default(0);
            $table->decimal('cost_per_unit', 10, 2)->nullable();
            $table->timestamps();

            $table->index(['type', 'quantity']);
            $table->index('reorder_level');
        });

        DB::statement('INSERT INTO inventory_items_new (id, name, category, source, type, quantity, unit, reorder_level, cost_per_unit, created_at, updated_at)
            SELECT id, name, category, source, type, quantity, unit, reorder_level, cost_per_unit, created_at, updated_at
            FROM inventory_items');

        Schema::drop('inventory_items');
        Schema::rename('inventory_items_new', 'inventory_items');

        DB::statement('PRAGMA foreign_keys=ON');
    }
};
