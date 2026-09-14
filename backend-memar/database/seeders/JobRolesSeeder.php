<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * الأدوار المهنية (طلب أيمن 2026-08-31): كان ثلاثة عشر موظفًا يتقاسمون دور
 * «موظف» نفسه بصلاحيات متطابقة — المندوب والسكرتيرة والمهندس والرسّام سواء،
 * وخمسة إداريين يتقاسمون «أدمن» فترى المحاسبة الموارد البشرية والعكس.
 *
 * لا يمسّ هذا الملف الأدوار النظامية الأربعة ولا يحذف شيئًا: يُنشئ أدوارًا
 * مهنية ويُسند كل موظف إلى دوره حسب بريده. من ليس في الخريطة يبقى على دوره.
 * idempotent: إعادة التشغيل تُحدّث الصلاحيات ولا تُكرّر.
 */
class JobRolesSeeder extends Seeder
{
    /**
     * الأدوار المهنية: [الاسم => [الوجهة, الصلاحيات]].
     *
     * القاعدة: الدور يحمل أضيق ما يكفي لعمله. التوسعة تكون باستثناء على الفرد
     * لا بتوسيع الدور على الجميع.
     *
     * @var array<string, array{dashboard: string, permissions: array<int, string>}>
     */
    public const ROLES = [
        'مدير مشاريع' => ['dashboard' => 'admin', 'permissions' => [
            'projects.view', 'projects.manage', 'projects.delete',
            'tasks.view', 'tasks.manage', 'tasks.delete',
            'appointments.view', 'appointments.manage', 'appointments.delete',
            'documents.view', 'documents.view.all', 'documents.manage',
            'requests.view', 'requests.view.all', 'requests.manage',
            'contracts.view', 'clients.view', 'pricing.view', 'finance.view',
            'crm.view', 'forum.view', 'self.view',
        ]],
        'مهندس تصميم' => ['dashboard' => 'employee', 'permissions' => [
            'projects.view', 'projects.manage',
            'tasks.view', 'tasks.manage',
            'appointments.view', 'appointments.manage',
            'documents.view', 'documents.manage',
            'requests.view', 'requests.manage',
            'forum.view', 'self.view',
        ]],
        'مهندس موقع' => ['dashboard' => 'employee', 'permissions' => [
            'projects.view',
            'tasks.view', 'tasks.manage',
            'appointments.view', 'appointments.manage',
            'documents.view',
            'requests.view',
            'forum.view', 'self.view',
        ]],
        'رسّام' => ['dashboard' => 'employee', 'permissions' => [
            'projects.view',
            'tasks.view', 'tasks.manage',
            'documents.view', 'documents.manage',
            'forum.view', 'self.view',
        ]],
        'مندوب مبيعات' => ['dashboard' => 'employee', 'permissions' => [
            'crm.view', 'crm.manage',
            'leads.view', 'leads.manage',
            'loyalty.view', 'clients.view',
            'appointments.view', 'appointments.manage',
            'requests.view', 'requests.manage',
            'tasks.view',
            'forum.view', 'self.view',
        ]],
        'محاسب' => ['dashboard' => 'admin', 'permissions' => [
            'finance.view', 'finance.manage',
            'contracts.view', 'contracts.manage',
            'pricing.view', 'pricing.manage',
            'projects.view', 'clients.view', 'documents.view', 'documents.view.all',
            'forum.view', 'self.view',
        ]],
        'موارد بشرية' => ['dashboard' => 'admin', 'permissions' => [
            'hr.view', 'hr.manage', 'hr.delete',
            'users.view',
            'documents.view', 'documents.view.all', 'appointments.view',
            'forum.view', 'self.view',
        ]],
        'سكرتارية' => ['dashboard' => 'employee', 'permissions' => [
            'appointments.view', 'appointments.manage',
            'requests.view', 'requests.view.all', 'requests.manage',
            'documents.view', 'documents.view.all', 'clients.view', 'crm.view',
            'tasks.view',
            'forum.view', 'self.view',
        ]],
    ];

    /** بريد كل موظف والدور المهني الذي يناسب عمله. */
    private const ASSIGNMENTS = [
        'pm@memar.kw' => 'مدير مشاريع',
        'mgr.mansour@memar.kw' => 'مدير مشاريع',
        'mgr.omari@memar.kw' => 'مدير مشاريع',
        'mgr.harbi@memar.kw' => 'مدير مشاريع',
        'ops@memar.kw' => 'مدير مشاريع',

        'eng.khaled@memar.kw' => 'مهندس تصميم',
        'eng.sara@memar.kw' => 'مهندس تصميم',
        'arch1@memar.kw' => 'مهندس تصميم',
        'arch2@memar.kw' => 'مهندس تصميم',
        'struct1@memar.kw' => 'مهندس تصميم',

        'site1@memar.kw' => 'مهندس موقع',
        'draft1@memar.kw' => 'رسّام',

        'rep@memar.kw' => 'مندوب مبيعات',
        'sales2@memar.kw' => 'مندوب مبيعات',

        'acc@memar.kw' => 'محاسب',
        'acc2@memar.kw' => 'محاسب',
        'hr@memar.kw' => 'موارد بشرية',
        'sec@memar.kw' => 'سكرتارية',
    ];

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (self::ROLES as $name => $spec) {
            $role = Role::findOrCreate($name, 'web');
            $role->dashboard = $spec['dashboard'];
            // مصفوفة حقوق كل وحدة — تُقرأ في شاشة الأدوار كما حُفظت
            $role->settings = array_merge((array) ($role->getAttribute('settings') ?? []), [
                'module_rights' => $this->moduleRights($spec['permissions']),
            ]);
            $role->save();

            // الصلاحيات الموجودة فعلًا فقط (تجاهُل أي اسم لم يُزرع بعد)
            $role->syncPermissions(array_values(array_filter(
                $spec['permissions'],
                fn (string $p): bool => Permission::where('name', $p)->where('guard_name', 'web')->exists(),
            )));
        }

        foreach (self::ASSIGNMENTS as $email => $roleName) {
            $user = User::where('email', $email)->first();
            // لا نمسّ مديري النظام: من يملك دورًا عامًّا يبقى عليه
            if ($user === null || $user->hasRole('super_admin')) {
                continue;
            }

            $user->syncRoles([$roleName]);
        }
    }

    /**
     * مصفوفة حقوق الوحدات من قائمة الصلاحيات — كي تظهر الشاشة ما يملكه الدور
     * بالضبط لا تعميمًا.
     *
     * @param  array<int, string>  $permissions
     * @return array<string, array{manage: bool, delete: bool}>
     */
    private function moduleRights(array $permissions): array
    {
        $groups = collect($permissions)->map(fn (string $p): string => explode('.', $p)[0])->unique();

        return $groups->mapWithKeys(fn (string $g): array => [$g => [
            'manage' => in_array("$g.manage", $permissions, true),
            'delete' => in_array("$g.delete", $permissions, true),
        ]])->all();
    }
}
