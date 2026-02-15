<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->uuid('cash_register_id')->nullable()->after('status');
            $table->string('payment_account')->nullable()->after('payment_method'); // Nubank, PicPay, etc

            $table->foreign('cash_register_id')->references('id')->on('cash_registers');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['cash_register_id']);
            $table->dropColumn(['cash_register_id', 'payment_account']);
        });
    }
};
