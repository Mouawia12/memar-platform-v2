<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * المرحلة التي نُقلت منها الفرصة — ليقرأ الكرت «نُقلت من تفاوض» لا مجرّد اسم
 * الناقل (طلب أيمن 2026-08-23).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->string('moved_from', 30)->nullable()->after('moved_at');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropColumn('moved_from');
        });
    }
};
