<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * متابعات العملاء — لوحة المتابعة (كانبان) في صفحة «المهام والمتابعة».
 * الأعمدة (مجدولة/اليوم/متأخرة/منجزة) تُشتقّ من due_date + done، لا تُخزَّن.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('followups', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('contact_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->string('client_name');                       // اسم العميل (يُظهر على الكرت)
            $table->string('channel', 40)->default('اتصال هاتفي'); // قناة المتابعة
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->date('due_date');
            $table->boolean('done')->default(false);
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('high');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('due_date');
            $table->index('done');
            $table->index('assigned_to');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('followups');
    }
};
