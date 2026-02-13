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
        Schema::create('restaurant_tables', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('number'); // Ex: 01, 12, VIP-1
            $table->integer('seats')->default(4);
            $table->enum('status', ['Livre', 'Ocupada', 'Pagamento', 'Reservada'])->default('Livre');
            $table->decimal('current_total', 10, 2)->default(0);
            $table->uuid('current_order_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('restaurant_tables');
    }
};
