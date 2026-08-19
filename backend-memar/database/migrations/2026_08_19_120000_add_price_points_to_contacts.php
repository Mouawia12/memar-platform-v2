<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * نقاط لكل خيار سعر (رينج السعر والنقاط) — يحددها المدير يدويًا لكل سعر من الأسعار
 * الثلاثة، وتُمنح للموظف عند نقل الفرصة إلى «صفقة رابحة». طبق أصل V42. طلب أيمن 2026-08-18.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->unsignedInteger('points_1')->default(0)->after('expected_points');
            $table->unsignedInteger('points_2')->default(0)->after('points_1');
            $table->unsignedInteger('points_3')->default(0)->after('points_2');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropColumn(['points_1', 'points_2', 'points_3']);
        });
    }
};
