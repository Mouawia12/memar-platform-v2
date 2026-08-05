<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * تقييم داخلي للعميل والشركة (اجتماع 2026-08-05، بندا 26/27): تقييم بالنجوم +
 * ملاحظات داخلية (سرعة الاستجابة، ملاحظات حسابية…) يراها الفريق فقط، لا العميل.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->unsignedTinyInteger('internal_rating')->nullable()->after('notes');
            $table->text('internal_notes')->nullable()->after('internal_rating');
        });

        Schema::table('companies', function (Blueprint $table): void {
            $table->unsignedTinyInteger('internal_rating')->nullable()->after('notes');
            $table->text('internal_notes')->nullable()->after('internal_rating');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', fn (Blueprint $t) => $t->dropColumn(['internal_rating', 'internal_notes']));
        Schema::table('companies', fn (Blueprint $t) => $t->dropColumn(['internal_rating', 'internal_notes']));
    }
};
