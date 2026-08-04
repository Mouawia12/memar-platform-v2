<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            // تفضيلات واجهة المستخدم (تخصيص القائمة الجانبية: المخفي/المطوي) — تبقى محفوظة عبر الأجهزة والتحديثات.
            $table->json('ui_prefs')->nullable()->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('ui_prefs');
        });
    }
};
