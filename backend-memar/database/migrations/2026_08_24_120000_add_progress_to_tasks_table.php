<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * نسبة إنجاز المهمة (0–100) — تظهر كشريط تقدّم على بطاقة المهمة
 * (طلب أيمن 2026-08-24).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->unsignedTinyInteger('progress')->default(0)->after('priority');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropColumn('progress');
        });
    }
};
