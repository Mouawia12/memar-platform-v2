<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * الأدوار الأساسية + كتالوج الصلاحيات + مستخدم أدمن افتراضي.
 */
class RolesAndAdminSeeder extends Seeder
{
    public function run(): void
    {
        // تصفير كاش الصلاحيات قبل الإنشاء (يمنع تعارض النسخ القديمة)
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        // ── الصلاحيات (كتالوج مبدئي — يتوسّع مع كل وحدة) ──
        $permissions = [
            'users.view', 'users.manage',
            'roles.view', 'roles.manage',
            'crm.view', 'crm.manage',
            'requests.view', 'requests.manage',
            'projects.view', 'projects.manage',
            'tasks.view', 'tasks.manage',
            'appointments.view', 'appointments.manage',
            'documents.view', 'documents.manage',
            'contracts.view', 'contracts.manage',
            'finance.view', 'finance.manage',
            'hr.view', 'hr.manage',
            'pricing.view', 'pricing.manage',
            'settings.manage',
        ];
        foreach ($permissions as $name) {
            Permission::findOrCreate($name, 'web');
        }

        // ── الأدوار ──
        $roles = [
            'super_admin' => $permissions, // كل الصلاحيات
            'manager' => ['crm.view', 'crm.manage', 'requests.view', 'requests.manage', 'projects.view', 'projects.manage', 'tasks.view', 'tasks.manage', 'appointments.view', 'appointments.manage', 'contracts.view', 'contracts.manage', 'finance.view', 'hr.view'],
            'architect' => ['projects.view', 'projects.manage', 'tasks.view', 'tasks.manage', 'appointments.view', 'appointments.manage', 'documents.view', 'documents.manage', 'crm.view'],
            'accountant' => ['finance.view', 'finance.manage', 'pricing.view'],
            'hr_manager' => ['hr.view', 'hr.manage'],
            'client' => [],
        ];
        foreach ($roles as $roleName => $rolePerms) {
            $role = Role::findOrCreate($roleName, 'web');
            $role->syncPermissions($rolePerms);
        }

        // ── مستخدم أدمن افتراضي ──
        $admin = User::updateOrCreate(
            ['email' => 'admin@memar.local'],
            [
                'name' => 'مدير النظام',
                'password' => Hash::make('password'),
                'is_active' => true,
            ],
        );
        $admin->syncRoles(['super_admin']);
    }
}
