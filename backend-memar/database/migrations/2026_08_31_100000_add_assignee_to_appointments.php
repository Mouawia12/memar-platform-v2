<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * الموظف المكلَّف بالموعد/الاجتماع (طلب أيمن 2026-08-31): كانت المواعيد بلا
 * مسؤول، فلا يعرف الموظف أيّها له ولا تظهر أسماء المكلَّفين في القوائم.
 * `created_by` يبقى «مَن سجّله» — وهو غير «مَن يحضره».
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table): void {
            $table->foreignId('assignee_id')->nullable()->after('project_id')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('assignee_id');
        });
    }
};
