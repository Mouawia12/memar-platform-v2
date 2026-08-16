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
            // نظام الولاء والفرص (طلب أيمن 2026-08-15): إدارة النقاط والقواعد والاستبدال والإحالات،
            // وإدارة العملاء المحتملين. leads.* منفصلة عن crm.* لضبط أدقّ لاحقًا.
            'loyalty.view', 'loyalty.manage',
            'leads.view', 'leads.manage',
            'settings.manage',
            // الخدمة الذاتية للموظف (شؤوني/حسابي/محادثات/إشعارات في بوابة الموظف) — تُمنح للموظف
            // فيرى شؤونه؛ ودور محدود بلا هذه الصلاحية لا يرى إلا ما أُشّر له. طلب أيمن 2026-08-13.
            'self.view',
        ];
        foreach ($permissions as $name) {
            Permission::findOrCreate($name, 'web');
        }

        // ── الأدوار النظامية الأربعة فقط (طلب أيمن 2026-08-12: تبسيط صارم) ──
        // كل دور له «نوع لوحة» يحدّد وجهته: admin=لوحة الإدارة، employee=بوابة الموظف،
        // client=بوابة العميل. الأدوار المتخصّصة تُنشأ من صفحة الأدوار حسب الحاجة.

        // الأدمن: كل الصلاحيات التشغيلية عدا إدارة المستخدمين والأدوار والإعدادات (للمدير العام وحده).
        $adminPerms = array_values(array_filter(
            $permissions,
            fn (string $p): bool => ! str_starts_with($p, 'users.')
                && ! str_starts_with($p, 'roles.')
                && $p !== 'settings.manage',
        ));

        // الموظف: دور تشغيلي كامل — يضيف ويعدّل في الوحدات التشغيلية (CRM/فرص/طلبات/مشاريع/
        // مهام/مواعيد/مستندات) كي تظهر أزرار «+ جديد» و«تعديل» في بوابته (طلب أيمن 2026-08-16).
        // الحذف والوحدات الحسّاسة (مالية/عقود/موارد بشرية/مستخدمون/أدوار/إعدادات/تسعير) تبقى للإدارة.
        // القيمة المالية للمشروع تبقى مخفيّة عنه (finance.view غير ممنوحة).
        $employeePerms = [
            'crm.view', 'crm.manage',
            'leads.view', 'leads.manage',
            'requests.view', 'requests.manage',
            'projects.view', 'projects.manage',
            'tasks.view', 'tasks.manage',
            'appointments.view', 'appointments.manage',
            'documents.view', 'documents.manage',
            'forum.view',
            'self.view',
        ];

        $roles = [
            'super_admin' => ['dashboard' => 'admin', 'perms' => $permissions],
            'admin' => ['dashboard' => 'admin', 'perms' => $adminPerms],
            'employee' => ['dashboard' => 'employee', 'perms' => $employeePerms],
            'client' => ['dashboard' => 'client', 'perms' => []],
        ];
        foreach ($roles as $roleName => $spec) {
            $role = Role::findOrCreate($roleName, 'web');
            $role->dashboard = $spec['dashboard'];
            $role->save();
            $role->syncPermissions($spec['perms']);
        }

        // ── تنظيف: إزالة أي أدوار متخصّصة قديمة لم تعُد نظامية (بعد فصل مستخدميها) ──
        Role::whereNotIn('name', array_keys($roles))->get()->each(function (Role $role): void {
            $role->users()->detach(); // فكّ ارتباط المستخدمين قبل الحذف (تُعاد إسنادهم عبر DemoUsersSeeder)
            $role->delete();
        });

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
