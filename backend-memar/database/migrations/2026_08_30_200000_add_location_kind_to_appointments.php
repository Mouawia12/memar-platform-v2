<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * نوع مكان الاجتماع (طلب أيمن 2026-08-30): المكتب · موقع المشروع · أونلاين ·
 * اتصال. كان `location` نصًّا حرًّا فيُكتب بصيغ مختلفة ولا يُفرز عليه؛ صار
 * النوع حقلًا مستقلًّا يبقى `location` تفصيلَه (القاعة، العنوان، الرقم).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table): void {
            $table->string('location_kind', 10)->nullable()->after('location');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table): void {
            $table->dropColumn('location_kind');
        });
    }
};
