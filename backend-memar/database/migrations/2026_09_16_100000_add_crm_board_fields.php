<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * لوحة إدارة الفرص الجديدة (2026-09-16):
 *  • أرشفة الفرصة — تخرج من اللوحة وتبقى في التقارير، وتُستعاد بنقرة.
 *  • مهلة الرد على طلب الإدارة — منها العدّاد التنازلي على البطاقة.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->timestamp('archived_at')->nullable()->after('stage');
            $table->index('archived_at');
        });

        Schema::table('directives', function (Blueprint $table): void {
            // null = «بدون مهلة» (مطلوب الآن)؛ دقّة الميلي‑ثانية كبقية طوابع الخيط.
            $table->timestamp('deadline_at', 3)->nullable()->after('body');
        });
    }

    public function down(): void
    {
        Schema::table('directives', function (Blueprint $table): void {
            $table->dropColumn('deadline_at');
        });

        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropIndex(['archived_at']);
            $table->dropColumn('archived_at');
        });
    }
};
