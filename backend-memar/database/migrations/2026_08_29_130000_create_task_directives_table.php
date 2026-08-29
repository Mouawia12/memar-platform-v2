<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * توجيهات الإدارة على المهمة (طلب أيمن 2026-08-29): المدير يكتب ملاحظة/أمرًا
 * على بطاقة الموظف، والموظف يردّ عليها فتُختم بـ«تم الرد». كل إرسال جديد سطر
 * مستقلّ — فيبقى تاريخ التوجيهات والردود محفوظًا لا يُدهَس.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_directives', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            // الردّ يعيش في السطر نفسه: توجيه واحد ↔ ردّ واحد، فالحالة تُقرأ بلا ضمّ
            $table->text('reply_body')->nullable();
            $table->foreignId('replied_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('replied_at')->nullable();
            $table->timestamps();

            $table->index(['task_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_directives');
    }
};
