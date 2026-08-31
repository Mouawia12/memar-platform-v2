<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * دقّة الميلي‑ثانية لطوابع نشاط البطاقة (2026-08-31): «جديد» يُحسب بمقارنة وقت
 * الرسالة بوقت آخر اطّلاع، وبدقّة الثانية كانت رسالةٌ تصل في ثانية الاطّلاع
 * نفسها تُعدّ مقروءة فيضيع تنبيهها. الكسر العشري يفصل بينهما.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table): void {
            $table->timestamp('created_at', 3)->nullable()->change();
            $table->timestamp('updated_at', 3)->nullable()->change();
        });

        Schema::table('directives', function (Blueprint $table): void {
            $table->timestamp('created_at', 3)->nullable()->change();
            $table->timestamp('updated_at', 3)->nullable()->change();
        });

        Schema::table('activity_reads', function (Blueprint $table): void {
            $table->timestamp('read_at', 3)->change();
        });
    }

    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table): void {
            $table->timestamp('created_at')->nullable()->change();
            $table->timestamp('updated_at')->nullable()->change();
        });

        Schema::table('directives', function (Blueprint $table): void {
            $table->timestamp('created_at')->nullable()->change();
            $table->timestamp('updated_at')->nullable()->change();
        });

        Schema::table('activity_reads', function (Blueprint $table): void {
            $table->timestamp('read_at')->change();
        });
    }
};
