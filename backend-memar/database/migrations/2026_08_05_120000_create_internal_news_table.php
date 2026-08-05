<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * أخبار الشركة الداخلية (اجتماع 2026-08-05): تظهر على هيرو لوحة الموظف —
 * قرارات/إعلانات/تنبيهات داخلية يديرها الأدمن، ويراها الطاقم فقط.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('internal_news', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->text('body')->nullable();
            // announcement (إعلان) · decision (قرار) · alert (تنبيه) · update (تحديث)
            $table->string('type', 24)->default('announcement');
            $table->string('cta_label')->nullable();
            $table->string('cta_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('internal_news');
    }
};
