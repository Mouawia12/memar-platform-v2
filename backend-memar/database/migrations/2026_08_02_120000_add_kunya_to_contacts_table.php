<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            // الكنية (مثال: أبو عبدالرحمن) — منفصلة عن الاسم واسم الشركة، تظهر في بطاقة العميل.
            $table->string('kunya', 100)->nullable()->after('full_name');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropColumn('kunya');
        });
    }
};
