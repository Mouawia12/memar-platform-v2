<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * نوع العميل: فرد (individual) أو شركة (company) — طلب أيمن 2026-08-14 عند إنشاء مشروع
 * بعميل جديد. اختياري؛ يُشتق افتراضيًا من وجود اسم شركة حين لا يُحدَّد.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->string('client_kind', 20)->nullable()->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropColumn('client_kind');
        });
    }
};
