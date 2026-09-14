<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * منشئ الفرصة — مَن سجّلها في النظام (طلب أيمن 2026-08-24)، منفصلًا عن
 * owner_id الذي صار «المكلّف بالفرصة» ويُختار يدويًا ويظهر على الكرت.
 * يُضبط في الخادم من جلسة المستخدم فلا يُنتحل، ولا يتغيّر بعد الإنشاء.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->foreignId('created_by')->nullable()->after('owner_id')->constrained('users')->nullOnDelete();
        });

        // الفرص القائمة: المنشئ هو المكلّف الحالي (أقرب تقدير متاح).
        DB::table('contacts')->whereNull('created_by')->update([
            'created_by' => DB::raw('owner_id'),
        ]);
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('created_by');
        });
    }
};
