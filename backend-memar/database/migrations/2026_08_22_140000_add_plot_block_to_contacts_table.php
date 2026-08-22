<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * عنوان الموقع بالنظام الكويتي: «قطعة» و«قسيمة» — طلب أيمن 2026-08-22 (نموذج الفرصة الجديد).
 * نصّية لا رقمية لأنها قد تحمل حروفًا (مثل «4أ»).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->string('block_no', 20)->nullable()->after('region');   // قطعة
            $table->string('plot_no', 20)->nullable()->after('block_no');  // قسيمة
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropColumn(['block_no', 'plot_no']);
        });
    }
};
