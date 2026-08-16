<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * المرحلة 4 — المتابعة والتحديثات:
 *  - opportunity_updates: تايملاين موحّد لكل حركة على الفرصة (مَن/متى/نوع/ملاحظة/الموعد القادم).
 *  - quick_actions: اختصارات جاهزة تحرّرها الإدارة (تم الاتصال/واتساب…)، وبعضها يُزيل حالة «عاجل».
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quick_actions', function (Blueprint $table): void {
            $table->id();
            $table->string('key', 40)->unique();          // معرّف ثابت: called/whatsapp/quote_sent…
            $table->string('label');                       // النص المعروض
            $table->string('icon', 16)->nullable();        // إيموجي/أيقونة
            $table->string('color', 16)->nullable();       // لون الشارة
            $table->boolean('clears_urgent')->default(false); // هل يُزيل «عاجل» عند تسجيله؟
            $table->unsignedInteger('position')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('opportunity_updates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action_key', 40)->nullable();  // اختصار مستخدَم (إن وُجد)
            $table->text('note')->nullable();
            $table->timestamp('next_followup_at')->nullable();
            $table->timestamps();

            $table->index(['contact_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunity_updates');
        Schema::dropIfExists('quick_actions');
    }
};
