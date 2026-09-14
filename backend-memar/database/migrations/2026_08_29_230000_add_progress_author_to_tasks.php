<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * مَن عدّل نسبة الإنجاز ومتى (طلب أيمن 2026-08-29): تُعدَّل النسبة من البطاقة
 * مباشرةً، فيلزم أن يُعرف صاحب آخر تعديل. القيمتان يضبطهما الخادم من الجلسة
 * ولا تُقبلان من الطلب.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->foreignId('progress_by')->nullable()->after('progress')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('progress_at')->nullable()->after('progress_by');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('progress_by');
            $table->dropColumn('progress_at');
        });
    }
};
