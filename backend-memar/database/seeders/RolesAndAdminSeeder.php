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

        // ── الصلاحيات (كتالوج CRUD لكل وحدة: view=عرض · manage=تعديل · delete=حذف) ──
        // (اجتماع 2026-08-05: صلاحيات CRUD لكل صفحة + جدول مربّعات في صفحة الصلاحيات)
        $permissions = [
            'users.view', 'users.manage', 'users.delete',
            'roles.view', 'roles.manage', 'roles.delete',
            'crm.view', 'crm.manage', 'crm.delete',
            'clients.view', // زيارة بروفيل العميل الداخلي (اجتماع 2026-08-05) — صلاحية منفصلة يمنحها الأدمن

            'requests.view', 'requests.view.all', 'requests.manage', 'requests.delete',
            'projects.view', 'projects.manage', 'projects.delete',
            'tasks.view', 'tasks.manage', 'tasks.delete',
            'appointments.view', 'appointments.manage', 'appointments.delete',
            'documents.view', 'documents.manage', 'documents.delete',
            'contracts.view', 'contracts.manage', 'contracts.delete',
            'finance.view', 'finance.manage', 'finance.delete',
            'hr.view', 'hr.manage', 'hr.delete',
            'pricing.view', 'pricing.manage',
            'forum.view', 'forum.manage', 'forum.delete',
            'settings.manage',
        ];
        foreach ($permissions as $name) {
            Permission::findOrCreate($name, 'web');
        }

        // ── الأدوار ──
        $roles = [
            'super_admin' => $permissions, // كل الصلاحيات
            'manager' => ['crm.view', 'crm.manage', 'clients.view', 'requests.view', 'requests.view.all', 'requests.manage', 'projects.view', 'projects.manage', 'tasks.view', 'tasks.manage', 'appointments.view', 'appointments.manage', 'contracts.view', 'contracts.manage', 'finance.view', 'hr.view', 'forum.view', 'forum.manage'],
            // المهندس يرى الطلبات المُسنَدة إليه فقط (requests.view بلا view.all)
            'architect' => ['projects.view', 'projects.manage', 'tasks.view', 'tasks.manage', 'appointments.view', 'appointments.manage', 'documents.view', 'documents.manage', 'crm.view', 'requests.view'],
            // المحاسب يدير سجل العقود (السعر والتفاصيل المالية) بعد أن يُنشئ المهندس المشروع
            // بلا قيمة — هناك تعيش الجزئية المالية. طلب أيمن 2026-08-09.
            'accountant' => ['finance.view', 'finance.manage', 'pricing.view', 'contracts.view', 'contracts.manage'],
            'hr_manager' => ['hr.view', 'hr.manage'],
            // أدوار فريق معمار كما ذكرها العميل (اجتماع 3) — قوالب مبدئية قابلة للتعديل من صفحة الصلاحيات
            'sales' => ['crm.view', 'crm.manage', 'clients.view', 'requests.view', 'requests.view.all', 'requests.manage', 'appointments.view', 'appointments.manage', 'tasks.view'],
            'secretary' => ['appointments.view', 'appointments.manage', 'requests.view', 'requests.view.all', 'requests.manage', 'crm.view', 'tasks.view', 'documents.view'],
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
