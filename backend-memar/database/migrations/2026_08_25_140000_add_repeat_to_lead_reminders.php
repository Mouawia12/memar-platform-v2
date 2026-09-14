<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * تكرار المتابعة الدوري (طلب أيمن 2026-08-25): المتابعات تتكرّر كل 3 أيام أو
 * أسبوع أو شهر. عند إنجاز متابعة متكرّرة يُجدول موعدها التالي تلقائيًا.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_reminders', function (Blueprint $table): void {
            $table->string('repeat_every', 10)->nullable()->after('remind_at');
        });
    }

    public function down(): void
    {
        Schema::table('lead_reminders', function (Blueprint $table): void {
            $table->dropColumn('repeat_every');
        });
    }
};
