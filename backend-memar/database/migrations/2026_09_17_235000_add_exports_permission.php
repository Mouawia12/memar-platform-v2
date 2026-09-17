<?php

declare(strict_types=1);

use App\Models\Role;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

/**
 * صلاحية تصدير البيانات (طلب أيمن 2026-09-17): «التصدير ما ينفعش حد يعمله، عايزها
 * بس خاصة للإدارة مش للموظفين».
 *
 * تُنشأ هنا وتُمنح للأدمن ومدير النظام وحدهما — لا عبر البذرة، لأن بذرة الأدوار
 * تُعيد ضبط صلاحيات كل الأدوار وكلمة مرور الأدمن، فلا تصلح للإنتاج.
 */
return new class extends Migration
{
    public function up(): void
    {
        Permission::findOrCreate('exports.view', 'web');

        foreach (['super_admin', 'admin'] as $name) {
            Role::where('name', $name)->where('guard_name', 'web')->first()?->givePermissionTo('exports.view');
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Permission::where('name', 'exports.view')->where('guard_name', 'web')->first()?->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
