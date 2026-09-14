<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * وصف المتابعة (طلب أيمن 2026-08-30): صار `note` عنوانَ المتابعة القصير في
 * النافذة الجديدة، فيلزم حقلٌ مستقلّ للتفاصيل الطويلة — نظير «الوصف» في
 * نافذة المهمة.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_reminders', function (Blueprint $table): void {
            $table->text('description')->nullable()->after('note');
        });
    }

    public function down(): void
    {
        Schema::table('lead_reminders', function (Blueprint $table): void {
            $table->dropColumn('description');
        });
    }
};
