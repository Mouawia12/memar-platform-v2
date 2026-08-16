<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * دورة حياة نقاط الموظف (بنية المرحلة 1): pending → earned → available → redeemed / cancelled.
 * الافتراضي 'available' حفاظًا على السلوك الحالي (كل حركة قائمة تُعتبر متاحة فورًا)؛
 * منطق التحوّل بين الحالات يُبنى في المرحلة 2 (محرّك القواعد والاستحقاق).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loyalty_transactions', function (Blueprint $table): void {
            // pending: معلّقة · earned: مستحقة (بعد التعاقد) · available: قابلة للاستبدال
            // redeemed: مستبدلة · cancelled: ملغاة
            $table->string('status', 16)->default('available')->after('source');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('loyalty_transactions', function (Blueprint $table): void {
            $table->dropIndex(['status']);
            $table->dropColumn('status');
        });
    }
};
