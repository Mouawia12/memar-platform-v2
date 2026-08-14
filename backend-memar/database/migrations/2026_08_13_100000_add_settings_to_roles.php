<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * إعدادات RBAC الدقيقة لكل دور (طبق أصل الشاشة القديمة): حقوق CRUD العامة، مستوى رؤية
 * الأسعار/المالية، نطاق المشاريع، سلطة الاعتماد، وصلاحيات التواصل. طلب أيمن 2026-08-13.
 * تُخزَّن كـJSON؛ والوحدات/CRUD/الرؤية تُزامَن أيضًا مع صلاحيات spatie للتحكّم الفعلي.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table): void {
            $table->json('settings')->nullable()->after('dashboard');
        });
    }

    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table): void {
            $table->dropColumn('settings');
        });
    }
};
