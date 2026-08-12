<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * نوع لوحة كل دور: admin | employee | client — يحدّد أي داشبورد يهبط عليه المستخدم وأي
 * صفحات/صلاحيات تخصّه. تبسيط نظام الأدوار (طلب أيمن 2026-08-12).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table): void {
            $table->string('dashboard', 20)->default('employee')->after('guard_name');
        });
    }

    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table): void {
            $table->dropColumn('dashboard');
        });
    }
};
