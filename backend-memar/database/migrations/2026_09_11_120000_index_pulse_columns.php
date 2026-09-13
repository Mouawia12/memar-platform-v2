<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * فهارس أعمدة نبضة التزامن.
 *
 * /sync/pulse يُستدعى كل 5 ثوانٍ لكل مستخدم، وينفّذ MAX(updated_at) على contacts
 * و projects و tasks. بلا فهرس فهذه ثلاث عمليات مسح جدول كامل × كل موظف × كل 5 ث
 * — أي آلاف عمليات المسح في الدقيقة على MariaDB والمكتب في وضع الخمول.
 */
return new class extends Migration
{
    /** الجداول التي تُقرأ منها النبضة أحدث طابع تعديل. */
    private const TABLES = ['contacts', 'projects', 'tasks'];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'updated_at')) {
                continue;
            }

            Schema::table($table, function (Blueprint $t) use ($table): void {
                $t->index('updated_at', "{$table}_updated_at_index");
            });
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $t) use ($table): void {
                $t->dropIndex("{$table}_updated_at_index");
            });
        }
    }
};
