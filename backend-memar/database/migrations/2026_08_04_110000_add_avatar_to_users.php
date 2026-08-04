<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * صورة شخصية للموظف/المهندس (طلب أيمن 2026-08-04): يرفعها بالنقر على دائرة الكارت.
 * تُخزَّن كملف على القرص الخاص وتُعرض كـ data URI (نفس آلية صور العملاء).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->foreignId('avatar_file_id')->nullable()->after('referral_code')
                ->constrained('stored_files')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('avatar_file_id');
        });
    }
};
