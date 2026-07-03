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
        Schema::table('pdf_uploads', function (Blueprint $table) {
            $table->longText('podcast_script')->nullable()->after('chat_history');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pdf_uploads', function (Blueprint $table) {
            $table->dropColumn('podcast_script');
        });
    }
};
