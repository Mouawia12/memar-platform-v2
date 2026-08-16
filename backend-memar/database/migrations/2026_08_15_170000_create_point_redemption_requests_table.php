<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * طلبات استبدال نقاط الموظف بالراتب (المرحلة 6): طلب → موافقة/رفض → قيد في كشف الرواتب.
 * لا تُخصم النقاط عند الطلب (تُحجز فقط منطقيًا)، بل عند اعتماد الإدارة.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('point_redemption_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('points');
            $table->decimal('amount_kwd', 12, 3);
            // pending · approved (أُضيفت للراتب) · rejected
            $table->string('status', 16)->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('salary_id')->nullable()->constrained('salaries')->nullOnDelete();
            $table->string('notes')->nullable(); // سبب الرفض أو ملاحظة الإدارة
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('point_redemption_requests');
    }
};
