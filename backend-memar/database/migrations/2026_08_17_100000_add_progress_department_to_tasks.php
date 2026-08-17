<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * نسبة الإنجاز والقسم للمهمة — لكرت المهمة طبق أصل معمار customer portal
 * (شريط تقدّم % + وسم القسم). طلب أيمن 2026-08-17.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->unsignedTinyInteger('progress')->default(0)->after('priority');
            $table->string('department', 60)->nullable()->after('progress');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropColumn(['progress', 'department']);
        });
    }
};
