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
            // المقر الرئيسي للشركة (يُعرض في بطاقات صفحة الشركة — مطابقة لتصميم Atoms).
            $table->string('head_office')->nullable()->after('company');
        });

        Schema::table('projects', function (Blueprint $table): void {
            // نسبة تقدّم معروضة اختيارية (0-100) — تُستخدم لعرض دقيق يطابق التصميم؛
            // وإلا تُشتق من الحالة في الواجهة.
            $table->unsignedTinyInteger('progress')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropColumn('head_office');
        });
        Schema::table('projects', function (Blueprint $table): void {
            $table->dropColumn('progress');
        });
    }
};
