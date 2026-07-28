<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * حالة «منتظر» للمواعيد (APPT-3): طلبات الحجز من الموقع تنزل كطلب منتظر
 * يؤكّده الموظف فيصبح «مجدول». الموظف عند الإنشاء اليدوي يبقى «مجدول».
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE appointments MODIFY status ENUM('pending','scheduled','done','cancelled') NOT NULL DEFAULT 'scheduled'");
    }

    public function down(): void
    {
        DB::statement("UPDATE appointments SET status='scheduled' WHERE status='pending'");
        DB::statement("ALTER TABLE appointments MODIFY status ENUM('scheduled','done','cancelled') NOT NULL DEFAULT 'scheduled'");
    }
};
