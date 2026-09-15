<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ترتيب المتابعة يدويًّا داخل عمودها في لوحة المتابعة (طلب 2026-09-15):
 * سحب البطاقة وإفلاتها فوق أخرى يرفعها أو ينزلها. 0 = لم تُرتَّب بعد،
 * فتبقى الجديدة أعلى عمودها وترتيبها بموعدها كما كان.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_reminders', function (Blueprint $table): void {
            $table->unsignedInteger('board_position')->default(0)->after('done');
        });
    }

    public function down(): void
    {
        Schema::table('lead_reminders', function (Blueprint $table): void {
            $table->dropColumn('board_position');
        });
    }
};
