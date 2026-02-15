<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cash_registers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->decimal('opening_balance', 10, 2);
            $table->decimal('closing_balance', 10, 2)->nullable();

            // Totals by payment account
            $table->decimal('total_cash', 10, 2)->default(0);
            $table->decimal('total_nubank', 10, 2)->default(0);
            $table->decimal('total_picpay', 10, 2)->default(0);
            $table->decimal('total_pix', 10, 2)->default(0);
            $table->decimal('total_ifood', 10, 2)->default(0);

            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->uuid('user_id'); // Who opened it
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_registers');
    }
};
