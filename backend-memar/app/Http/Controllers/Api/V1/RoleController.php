<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends ApiController
{
    /** الأدوار النظامية الأربعة الثابتة (لا تُحذف). */
    private const SYSTEM_ROLES = ['super_admin', 'admin', 'employee', 'client'];

    /** تسميات عربية للأدوار النظامية؛ الأدوار المخصّصة تُعرض باسمها كما هو. */
    private const ROLE_LABELS = [
        'super_admin' => 'مدير عام',
        'admin' => 'أدمن',
        'employee' => 'موظف',
        'client' => 'عميل',
    ];

    /** نوع لوحة كل دور نظامي. */
    private const SYSTEM_DASHBOARDS = [
        'super_admin' => 'admin',
        'admin' => 'admin',
        'employee' => 'employee',
        'client' => 'client',
    ];

    /** أنواع اللوحات المتاحة + تسمياتها. */
    public const DASHBOARDS = ['admin' => 'لوحة الإدارة', 'employee' => 'بوابة الموظف', 'client' => 'بوابة العميل'];

    /** تسميات عربية لمجموعات الصلاحيات. */
    private const GROUP_LABELS = [
        'crm' => 'العملاء والعلاقات',
        'clients' => 'ملف العميل الداخلي',
        'requests' => 'الطلبات',
        'projects' => 'المشاريع',
        'tasks' => 'المهام',
        'appointments' => 'المواعيد',
        'documents' => 'المستندات',
        'contracts' => 'العقود',
        'finance' => 'الحسابات والفواتير',
        'hr' => 'الموارد البشرية',
        'pricing' => 'الأسعار والخدمات',
        'settings' => 'الإعدادات والصلاحيات',
        'users' => 'المستخدمون',
        'roles' => 'الأدوار',
        'self' => 'الخدمة الذاتية (شؤوني/حسابي)',
    ];

    /**
     * أي أنواع اللوحات يخصّها كل مجموعة صلاحيات. لوحة العميل بلا صلاحيات طاقم (الوصول
     * يُدار من ملف العميل). ما لا يُذكر هنا يخصّ الأدمن فقط.
     */
    private const GROUP_DASHBOARDS = [
        'crm' => ['admin', 'employee'],
        'requests' => ['admin', 'employee'],
        'projects' => ['admin', 'employee'],
        'tasks' => ['admin', 'employee'],
        'appointments' => ['admin', 'employee'],
        'documents' => ['admin', 'employee'],
        'forum' => ['admin', 'employee'],
        'self' => ['employee'], // الخدمة الذاتية تخصّ بوابة الموظف فقط
    ];

    private function dashboardOf(Role $role): string
    {
        return self::SYSTEM_DASHBOARDS[$role->name] ?? ($role->getAttribute('dashboard') ?: 'employee');
    }

    /** الأنواع التي تُتاح لها مجموعة صلاحية (الافتراضي: الأدمن فقط). */
    private function groupDashboards(string $group): array
    {
        return self::GROUP_DASHBOARDS[$group] ?? ['admin'];
    }

    /** قائمة الأدوار (للاختيار في نماذج المستخدمين). */
    public function index(): JsonResponse
    {
        $roles = Role::orderBy('id')->get()->map(fn (Role $role): array => [
            'name' => $role->name,
            'label' => self::ROLE_LABELS[$role->name] ?? $role->name,
            'dashboard' => $this->dashboardOf($role),
        ]);

        return $this->ok($roles);
    }

    /** الأدوار مع صلاحياتها وعدد المستخدمين — لصفحة الإدارة. */
    public function catalog(): JsonResponse
    {
        $counts = DB::table('model_has_roles')
            ->selectRaw('role_id, COUNT(*) as total')
            ->groupBy('role_id')
            ->pluck('total', 'role_id');

        $roles = Role::query()
            ->with('permissions:id,name')
            ->orderBy('id')
            ->get()
            ->map(fn (Role $role): array => [
                'id' => $role->id,
                'name' => $role->name,
                'label' => self::ROLE_LABELS[$role->name] ?? $role->name,
                'dashboard' => $this->dashboardOf($role),
                'is_system' => in_array($role->name, self::SYSTEM_ROLES, true),
                'users_count' => (int) ($counts[$role->id] ?? 0),
                'permissions' => $role->permissions->pluck('name')->all(),
            ]);

        return $this->ok($roles);
    }

    /** كل الصلاحيات مجمّعة حسب الوحدة، وكل مجموعة موسومة بالأنواع التي تخصّها. */
    public function permissions(): JsonResponse
    {
        $groups = Permission::orderBy('name')->get()
            ->groupBy(fn (Permission $p): string => explode('.', (string) $p->name)[0])
            ->map(function ($items, string $key): array {
                // خريطة الفعل → اسم الصلاحية (view/manage/delete) لبناء مصفوفة CRUD في الواجهة.
                $byAction = [];
                foreach ($items as $p) {
                    $action = explode('.', (string) $p->name)[1] ?? 'view';
                    $byAction[$action] = $p->name;
                }

                return [
                    'group' => $key,
                    'label' => self::GROUP_LABELS[$key] ?? $key,
                    'dashboards' => $this->groupDashboards($key), // أي أنواع اللوحات تُظهر هذه المجموعة
                    'actions' => [
                        'view' => $byAction['view'] ?? null,
                        'manage' => $byAction['manage'] ?? null,
                        'delete' => $byAction['delete'] ?? null,
                    ],
                    'permissions' => $items->map(fn (Permission $p): array => [
                        'name' => $p->name,
                        'action' => str_ends_with((string) $p->name, '.manage') ? 'إدارة' : (str_ends_with((string) $p->name, '.delete') ? 'حذف' : 'عرض'),
                    ])->values(),
                ];
            })
            ->values();

        return $this->ok($groups);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateRole($request, null);

        $role = Role::create(['name' => $data['name'], 'guard_name' => 'web']);
        $role->dashboard = $data['dashboard'];
        $role->save();
        $role->syncPermissions($this->clampPermissions($data['permissions'], $data['dashboard']));

        return $this->created(['id' => $role->id], 'تم إنشاء الدور');
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        abort_if($role->name === 'super_admin', 403, 'لا يمكن تعديل دور المدير العام');

        $data = $this->validateRole($request, $role->id);

        // نوع الأدوار النظامية ثابت؛ المخصّصة يمكن تغيير نوعها.
        $dashboard = in_array($role->name, self::SYSTEM_ROLES, true)
            ? $this->dashboardOf($role)
            : $data['dashboard'];

        $role->update(['name' => $data['name']]);
        $role->dashboard = $dashboard;
        $role->save();
        $role->syncPermissions($this->clampPermissions($data['permissions'], $dashboard));

        return $this->ok(['id' => $role->id], 'تم تحديث الدور وصلاحياته');
    }

    public function destroy(Role $role): JsonResponse
    {
        abort_if(in_array($role->name, self::SYSTEM_ROLES, true), 403, 'لا يمكن حذف دور نظامي');
        abort_if($role->users()->exists(), 422, 'لا يمكن حذف دور مرتبط بمستخدمين');

        $role->delete();

        return $this->ok(null, 'تم حذف الدور');
    }

    /**
     * يقصر الصلاحيات على ما يخصّ نوع لوحة الدور — دفاع خادمي: دور «موظف» لا يُمنح صلاحية
     * مالية مثلًا حتى لو أُرسلت في الطلب.
     *
     * @param  array<int, string>  $permissions
     * @return array<int, string>
     */
    private function clampPermissions(array $permissions, string $dashboard): array
    {
        return array_values(array_filter($permissions, function (string $name) use ($dashboard): bool {
            $group = explode('.', $name)[0];

            return in_array($dashboard, $this->groupDashboards($group), true);
        }));
    }

    /**
     * @return array{name: string, dashboard: string, permissions: array<int, string>}
     */
    private function validateRole(Request $request, ?int $ignoreId): array
    {
        /** @var array{name: string, dashboard: string, permissions?: array<int, string>} $validated */
        $validated = $request->validate([
            // اسم الدور يقبل العربية والإنجليزية والأرقام والمسافات (طلب أيمن 2026-08-12).
            'name' => ['required', 'string', 'max:100', 'regex:/^[\p{Arabic}A-Za-z0-9 _\-]+$/u', Rule::unique('roles', 'name')->ignore($ignoreId)],
            'dashboard' => ['required', Rule::in(array_keys(self::DASHBOARDS))],
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'name')],
        ], [
            'name.regex' => 'اسم الدور يقبل حروفًا عربية أو إنجليزية وأرقامًا ومسافات فقط.',
            'dashboard.required' => 'حدّد نوع الدور (لوحة الإدارة / بوابة الموظف / بوابة العميل).',
        ]);

        return [
            'name' => trim($validated['name']),
            'dashboard' => $validated['dashboard'],
            'permissions' => $validated['permissions'] ?? [],
        ];
    }
}
