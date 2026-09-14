<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * لون الاختصار — تضبطه الإدارة من نافذة «إعدادات النقاط والاختصارات» (طلب أيمن 2026-08-22).
 * فارغ = الواجهة تشتقّ لونًا ثابتًا من الاسم (tagColor).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('crm_tags', function (Blueprint $table): void {
            $table->string('color', 9)->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('crm_tags', function (Blueprint $table): void {
            $table->dropColumn('color');
        });
    }
};
