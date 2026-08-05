<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * تذكيرات متابعة الفرص/العملاء (اجتماع 2026-08-05): يضع الموظف تذكيرًا بتاريخ ووقت
 * على الفرصة، وعند حلوله يظهر تنبيه بارز على الكرت («تذكير مستحق»). سلسلة تذكيرات ممكنة.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_reminders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->timestamp('remind_at');
            $table->string('note')->nullable();
            $table->boolean('done')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['contact_id', 'done', 'remind_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_reminders');
    }
};
