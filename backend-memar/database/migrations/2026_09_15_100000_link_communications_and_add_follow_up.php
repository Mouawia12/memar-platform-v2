<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * صفحة التواصل (2026-09-15): يُربط السجل بجهته الحقيقية بدل الاسم المكتوب يدويًّا
 * — عميل (contacts) أو شركة (companies) أو موظف (users) حسب contact_type —
 * ويُضاف تذكير متابعة يظهر في إشعارات من سجّل التواصل حين يحين موعده.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('communications', function (Blueprint $table): void {
            $table->foreignId('contact_id')->nullable()->after('contact_type')->constrained('contacts')->nullOnDelete();
            $table->foreignId('company_id')->nullable()->after('contact_id')->constrained('companies')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->after('company_id')->constrained('users')->nullOnDelete();
            $table->timestamp('follow_up_at')->nullable()->after('happened_at');
            $table->timestamp('follow_up_done_at')->nullable()->after('follow_up_at');

            $table->index(['follow_up_at', 'follow_up_done_at']);
        });
    }

    public function down(): void
    {
        Schema::table('communications', function (Blueprint $table): void {
            $table->dropIndex(['follow_up_at', 'follow_up_done_at']);
            $table->dropConstrainedForeignId('contact_id');
            $table->dropConstrainedForeignId('company_id');
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn(['follow_up_at', 'follow_up_done_at']);
        });
    }
};
