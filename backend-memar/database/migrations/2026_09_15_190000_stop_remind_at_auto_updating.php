<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * موعد المتابعة كان يُمسح مع أي تعديل على صفّها (اكتُشف 2026-09-15).
 *
 * `timestamp('remind_at')` بلا nullable على MariaDB/MySQL حين يكون
 * explicit_defaults_for_timestamp مطفأً (افتراضي MariaDB 10.4) يُنشأ بـ
 * ON UPDATE CURRENT_TIMESTAMP — فإنجاز المتابعة أو تعديل عنوانها أو مكلَّفها
 * أو ترتيبها في اللوحة يستبدل موعدها بلحظة التعديل بصمت. نُبقي النوع والقيم
 * كما هي ونُسقط التحديث التلقائي وحده.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            return;
        }
        DB::statement('ALTER TABLE lead_reminders MODIFY remind_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
    }

    public function down(): void
    {
        // لا عودة للخلل: التحديث التلقائي للموعد لم يكن مقصودًا قطّ.
    }
};
