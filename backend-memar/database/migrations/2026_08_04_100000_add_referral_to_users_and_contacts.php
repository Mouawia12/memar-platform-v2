<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * إحالة الموظف/المهندس (اجتماع 2026-08-03، مقطع 15): لكل موظف رقم حساب ثابت وكود إحالة،
 * والعميل الجديد يُربط بالموظف الذي أحاله لحساب بونص المبيعات.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            // رقم حساب الموظف الثابت: MEM-<السنة>-<تسلسل> (بادئة MEM للطاقم).
            $table->string('account_number', 24)->nullable()->unique()->after('phone');
            // كود إحالة الموظف الثابت: MEMAR-<...> — لجلب عملاء ببونص مبيعات.
            $table->string('referral_code', 40)->nullable()->unique()->after('account_number');
        });

        Schema::table('contacts', function (Blueprint $table): void {
            // الموظف الذي أحال هذا العميل (لبونص المبيعات) — اختياري.
            $table->foreignId('referred_by_user_id')->nullable()->after('referral_code')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('referred_by_user_id');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['account_number', 'referral_code']);
        });
    }
};
