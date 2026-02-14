<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'location_link')) {
                $table->string('location_link')->nullable()->after('address');
            }
            if (!Schema::hasColumn('customers', 'lat')) {
                $table->string('lat')->nullable()->after('location_link');
            }
            if (!Schema::hasColumn('customers', 'lng')) {
                $table->string('lng')->nullable()->after('lat');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['lat', 'lng']);
        });
    }
};
