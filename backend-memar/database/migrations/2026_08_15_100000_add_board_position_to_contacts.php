<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ترتيب يدوي للفرصة داخل عمود CRM (أعلى/أسفل) — طلب أيمن 2026-08-15، متاح لكل الأدوار.
 * الافتراضي 0 → الترتيب يبقى حسب الأحدث حتى يُعاد الترتيب يدويًا.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->integer('board_position')->default(0)->after('stage');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropColumn('board_position');
        });
    }
};
