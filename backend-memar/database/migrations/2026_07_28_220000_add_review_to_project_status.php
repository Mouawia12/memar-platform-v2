<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * حالة «مراجعة» للمشروع (PROJ-5): الحالات نشط/مراجعة/منجز/معلّق/ملغي
 * (+ مسودة). نستخدم change() ليعمل على MySQL وsqlite (بيئة الاختبار) معًا،
 * فيعيد بناء قيد الحالة بدل تعديل ENUM الخاص بـMySQL فقط.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            $table->enum('status', ['draft', 'active', 'review', 'on_hold', 'done', 'cancelled'])
                ->default('draft')
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            $table->enum('status', ['draft', 'active', 'on_hold', 'done', 'cancelled'])
                ->default('draft')
                ->change();
        });
    }
};
