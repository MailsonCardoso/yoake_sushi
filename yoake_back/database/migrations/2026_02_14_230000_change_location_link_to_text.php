<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Alter output columns to TEXT to support long Google Maps URLs
        DB::statement('ALTER TABLE customers MODIFY location_link TEXT NULL');

        // Also ensure orders table supports long URLs for delivery_location_link
        // Checking if the column exists first to avoid errors if the table is fresh/different
        if (Schema::hasColumn('orders', 'delivery_location_link')) {
            DB::statement('ALTER TABLE orders MODIFY delivery_location_link TEXT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE customers MODIFY location_link VARCHAR(255) NULL');

        if (Schema::hasColumn('orders', 'delivery_location_link')) {
            DB::statement('ALTER TABLE orders MODIFY delivery_location_link VARCHAR(255) NULL');
        }
    }
};
