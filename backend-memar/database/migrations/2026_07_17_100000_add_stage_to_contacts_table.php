<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->string('stage', 30)->default('new')->after('status');
            $table->decimal('deal_value_kwd', 12, 3)->default(0)->after('stage');
            $table->index('stage');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropIndex(['stage']);
            $table->dropColumn(['stage', 'deal_value_kwd']);
        });
    }
};
