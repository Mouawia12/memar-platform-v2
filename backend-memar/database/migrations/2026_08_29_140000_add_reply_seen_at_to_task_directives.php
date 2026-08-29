<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * متى اطّلع المُرسِل على ردّ الموظف (طلب أيمن 2026-08-29): ما دام فارغًا تظهر
 * على بطاقته شارة «تم الرد» بعددها، وتنطفئ حين يفتح خيط التوجيهات.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_directives', function (Blueprint $table): void {
            $table->timestamp('reply_seen_at')->nullable()->after('replied_at');
        });
    }

    public function down(): void
    {
        Schema::table('task_directives', function (Blueprint $table): void {
            $table->dropColumn('reply_seen_at');
        });
    }
};
