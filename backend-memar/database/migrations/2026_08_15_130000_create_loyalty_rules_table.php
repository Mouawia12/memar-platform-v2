<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * قواعد نقاط الموظفين الديناميكية (المرحلة 2) — تحرّرها الإدارة دون كود.
 * كل قاعدة تربط نطاق قيمة مشروع (ونوعه اختياريًا) بعدد نقاط.
 * مثال: 500–999 د.ك = 10 · 1000–1999 = 20 · 2000–2999 = 50 · 3000+ = 100.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_rules', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('project_type')->nullable();       // null = ينطبق على كل الأنواع
            $table->decimal('min_value', 12, 3)->default(0);   // أدنى قيمة مشروع (د.ك)
            $table->decimal('max_value', 12, 3)->nullable();   // null = مفتوح للأعلى
            $table->unsignedInteger('points');
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('position')->default(0);   // أولوية عند تطابق أكثر من قاعدة
            $table->timestamps();

            $table->index(['is_active', 'min_value']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_rules');
    }
};
