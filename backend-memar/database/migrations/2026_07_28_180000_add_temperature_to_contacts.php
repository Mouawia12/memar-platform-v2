<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * حرارة الفرصة (طلب CRM-2): ساخنة/دافئة/باردة/عادية — طبق أصل PRIORITY_OPTS.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->enum('temperature', ['hot', 'warm', 'cold', 'normal'])->default('normal')->after('stage');
            $table->index('temperature');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropIndex(['temperature']);
            $table->dropColumn('temperature');
        });
    }
};
