<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * متى اطّلع المكلَّف على التوجيه (طلب أيمن 2026-08-29): ما دام فارغًا تُنبّه
 * بطاقته بوميض «توجيه جديد»، ويهدأ الوميض بفتح الخيط لا بالردّ — فالتنبيه
 * للوصول، وشارة «بانتظار ردّك» تبقى حتى يردّ فعلًا.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_directives', function (Blueprint $table): void {
            $table->timestamp('seen_at')->nullable()->after('body');
        });
    }

    public function down(): void
    {
        Schema::table('task_directives', function (Blueprint $table): void {
            $table->dropColumn('seen_at');
        });
    }
};
