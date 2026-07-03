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
        Schema::table('flashcards', function (Blueprint $table) {
            $table->integer('repetitions')->default(0);
            $table->integer('interval')->default(0);
            $table->float('easiness_factor')->default(2.5);
            $table->timestamp('next_review_date')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('flashcards', function (Blueprint $table) {
            $table->dropColumn(['repetitions', 'interval', 'easiness_factor', 'next_review_date']);
        });
    }
};
