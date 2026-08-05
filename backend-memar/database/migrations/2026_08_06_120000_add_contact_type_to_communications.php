<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * تصنيف جهة التواصل (اجتماع 2026-08-05، بند 36): كل تواصل مع عميل أو شركة أو موظف
 * (فريق) — لفلترة المحادثات حسب النوع في صفحة التواصل.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('communications', function (Blueprint $table): void {
            // client | company | staff
            $table->string('contact_type', 16)->default('client')->after('contact_name');
            $table->index('contact_type');
        });
    }

    public function down(): void
    {
        Schema::table('communications', function (Blueprint $table): void {
            $table->dropIndex(['contact_type']);
            $table->dropColumn('contact_type');
        });
    }
};
