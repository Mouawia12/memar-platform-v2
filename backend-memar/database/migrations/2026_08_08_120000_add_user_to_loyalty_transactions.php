<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * توسيع سجل الولاء ليخدم الموظفين (users) لا العملاء (contacts) فقط:
 * حركة نقاط الموظف تحمل user_id (المُكتَسِب) وcontact_id = NULL (كي لا تختلط برصيد العميل).
 * الفرصة/المشروع المرجعي يُحفظ في reference. طلب أيمن — اقتصاد نقاط الموظف (اجتماع 2026-08-07).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loyalty_transactions', function (Blueprint $table): void {
            $table->foreignId('contact_id')->nullable()->change();
            $table->foreignId('user_id')->nullable()->after('contact_id')->constrained('users')->cascadeOnDelete();
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('loyalty_transactions', function (Blueprint $table): void {
            $table->dropIndex(['user_id', 'created_at']);
            $table->dropConstrainedForeignId('user_id');
            $table->foreignId('contact_id')->nullable(false)->change();
        });
    }
};
