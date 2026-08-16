<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * إعدادات ديناميكية عامة يحرّرها الأدمن دون تعديل الكود (بنية المرحلة 1 لنظام الولاء والفرص).
 * كل صف يتجاوز مفتاح config في وقت التشغيل (مثال: loyalty.salary.points_per_kwd = 60)،
 * فتصبح أرقام config/loyalty.php قابلة للضبط من لوحة الإدارة دون نشر جديد.
 * الـgroup = فضاء التسمية (loyalty…) لتجميعها في الواجهة وحصر ما يُسمح بتجاوزه.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('key')->unique();      // مسار config كامل: loyalty.salary.points_per_kwd
            $table->string('group', 32)->index(); // فضاء التسمية: loyalty
            $table->json('value')->nullable();    // قيمة عددية/نصية/منطقية/مصفوفة كـJSON
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_settings');
    }
};
