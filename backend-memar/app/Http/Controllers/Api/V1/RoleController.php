<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Models\Role;
use App\Models\User;
use Spatie\Permission\Models\Permission;

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

        $userMorph = (new User)->getMorphClass();

        // مستخدمو كل دور دفعةً واحدة (join مباشر، مستقل عن حارس المصادقة) لتفادي N+1.
        $roleUsers = DB::table('model_has_roles as mhr')
            ->join('users as u', 'u.id', '=', 'mhr.model_id')
            ->where('mhr.model_type', $userMorph)
            ->orderBy('u.name')
            ->get(['mhr.role_id', 'u.id', 'u.name', 'u.email', 'u.is_active'])
            ->groupBy('role_id');

        // المستخدمون ذوو صلاحيات مباشرة (استثناء خارج الدور).
        $exceptionIds = array_flip(
            DB::table('model_has_permissions')->where('model_type', $userMorph)->pluck('model_id')->all()
        );

        $roles = Role::query()
            ->with('permissions:id,name')
            ->orderBy('id')
            ->get()
            ->map(function (Role $role) use ($counts, $roleUsers, $exceptionIds): array {
                $rbac = $this->rbacOf($role);

                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'label' => self::ROLE_LABELS[$role->name] ?? $role->name,
                    // «الكود» في تصميم RBAC — نعرض الاسم البرمجي كرمز للدور (R_ADMIN ↔ super_admin).
                    'code' => 'R_'.mb_strtoupper($role->name),
                    'dashboard' => $this->dashboardOf($role),
                    'is_system' => in_array($role->name, self::SYSTEM_ROLES, true),
                    'users_count' => (int) ($counts[$role->id] ?? 0),
                    'permissions' => $role->permissions->pluck('name')->all(),
                    // المستخدمون المرتبطون بالدور (طبق الأصل: جدول الاسم/البريد/الحالة/استثناء).
                    // «استثناء» = يملك صلاحيات مباشرة خارج دوره (model_has_permissions).
                    'users' => ($roleUsers->get($role->id) ?? collect())->map(fn ($u): array => [
                        'id' => (int) $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'is_active' => (bool) $u->is_active,
                        'has_exception' => isset($exceptionIds[$u->id]),
                    ])->values(),
                    // حالة RBAC الكاملة (الوحدات + الحقوق + الرؤية + النطاق + الاعتماد + التواصل)
                    'modules' => $rbac['modules'],
                    'modules_count' => count($rbac['modules']),
                    'rbac' => $rbac,
                    // أقسام/عناصر السايدبار المخفية لهذا الدور (يضبطها الأدمن) — طلب أيمن 2026-08-17.
                    'nav_hidden' => array_values(array_filter((array) ($role->getAttribute('settings')['nav_hidden'] ?? []), 'is_string')),
                ];
            });

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
        $role->settings = $data['settings'];
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
        if ($data['settings'] !== null) {
            $newSettings = $data['settings'];
            // إعداد ظهور القائمة يُدار من نقطة منفصلة (navVisibility)؛ نحافظ عليه إن لم يُرسَل هنا.
            $existingNav = $role->getAttribute('settings')['nav_hidden'] ?? null;
            if (! array_key_exists('nav_hidden', $newSettings) && $existingNav !== null) {
                $newSettings['nav_hidden'] = $existingNav;
            }
            $role->settings = $newSettings;
        }
        $role->save();
        $role->syncPermissions($this->clampPermissions($data['permissions'], $dashboard));

        return $this->ok(['id' => $role->id], 'تم تحديث الدور وصلاحياته');
    }

    /**
     * ضبط ظهور أقسام/عناصر القائمة الجانبية لهذا الدور (طلب أيمن 2026-08-17):
     * قائمة مفاتيح مخفية (معرّفات أقسام + مفاتيح عناصر) تُخزَّن في settings.nav_hidden.
     */
    public function navVisibility(Request $request, Role $role): JsonResponse
    {
        $data = $request->validate([
            'nav_hidden' => ['present', 'array'],
            'nav_hidden.*' => ['string', 'max:60'],
        ]);

        $settings = (array) ($role->getAttribute('settings') ?? []);
        $settings['nav_hidden'] = array_values(array_unique(array_filter($data['nav_hidden'], 'is_string')));
        $role->settings = $settings;
        $role->save();

        return $this->ok(['nav_hidden' => $settings['nav_hidden']], 'تم تحديث ظهور القائمة للدور');
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

    /** إعدادات RBAC الافتراضية لدور (تُدمج مع المخزّن). */
    private function defaultSettings(): array
    {
        return [
            'rights' => ['view' => 'all', 'edit' => 'none', 'delete' => false],
            'visibility' => ['pricing' => 'none', 'financial' => 'none'],
            'scope' => ['projects' => 'assigned'],
            'approval_authority' => false,
            'chat' => ['types' => ['all'], 'restrict' => 'none'],
        ];
    }

    /**
     * حالة RBAC لدور: الوحدات (المجموعات التي يملك .view عليها) + الحقوق/الرؤية/النطاق/
     * الاعتماد/التواصل من settings المخزّنة، أو مُشتقّة من صلاحياته إن لم تُحفَظ بعد.
     */
    private function rbacOf(Role $role): array
    {
        $perms = $role->permissions->pluck('name')->all();
        $has = fn (string $p): bool => in_array($p, $perms, true);
        $modules = collect($perms)
            ->map(fn (string $p): string => explode('.', $p)[0])
            ->unique()
            ->filter(fn (string $g): bool => $has("$g.view"))
            ->values()->all();

        $stored = $role->getAttribute('settings');
        if (is_array($stored)) {
            // دمج علوي فقط (لا array_replace_recursive) حتى لا تُدمج القوائم كـ chat.types عنصرًا بعنصر.
            return array_merge($this->defaultSettings(), $stored, ['modules' => $modules]);
        }

        // اشتقاق العرض من الصلاحيات الحالية (لأدوار لم تُحفَظ إعداداتها بعد)
        $hasManage = collect($modules)->contains(fn (string $g): bool => $has("$g.manage"));
        $hasDelete = collect($modules)->contains(fn (string $g): bool => $has("$g.delete"));

        return array_merge($this->defaultSettings(), [
            'modules' => $modules,
            'rights' => ['view' => 'all', 'edit' => $hasManage ? 'full' : 'none', 'delete' => $hasDelete],
            'visibility' => [
                'pricing' => $has('pricing.view') ? 'full' : 'none',
                'financial' => $has('finance.view') ? 'full' : 'none',
            ],
            'scope' => ['projects' => $this->dashboardOf($role) === 'admin' ? 'all' : 'assigned'],
            'approval_authority' => $this->dashboardOf($role) === 'admin',
        ]);
    }

    /**
     * يبني قائمة صلاحيات spatie من حمولة RBAC: كل وحدة مؤشّرة تُمنح .view؛ وإن كان
     * التعديل مسموحًا تُمنح .manage، والحذف يمنح .delete؛ ورؤية الأسعار/المالية تمنح
     * pricing.view/finance.view. تُقصّ على نوع اللوحة وتُبقى الموجودة فقط.
     *
     * @return array<int, string>
     */
    private function permissionsFromRbac(array $data, string $dashboard): array
    {
        $rights = $data['rights'] ?? [];
        $visibility = $data['visibility'] ?? [];
        $out = [];

        foreach (($data['modules'] ?? []) as $group) {
            if (! in_array($dashboard, $this->groupDashboards($group), true)) {
                continue;
            }
            $out[] = "$group.view";
            if (($rights['edit'] ?? 'none') !== 'none') {
                $out[] = "$group.manage";
            }
            if (! empty($rights['delete'])) {
                $out[] = "$group.delete";
            }
        }
        if (($visibility['pricing'] ?? 'none') !== 'none') {
            $out[] = 'pricing.view';
        }
        if (($visibility['financial'] ?? 'none') !== 'none') {
            $out[] = 'finance.view';
        }

        // نُبقي الصلاحيات الموجودة فعلًا فقط
        return array_values(array_unique(array_filter($out, fn (string $p): bool => Permission::where('name', $p)->exists())));
    }

    /**
     * @return array{name: string, dashboard: string, permissions: array<int, string>}
     */
    private function validateRole(Request $request, ?int $ignoreId): array
    {
        $validated = $request->validate([
            // اسم الدور يقبل العربية والإنجليزية والأرقام والمسافات (طلب أيمن 2026-08-12).
            'name' => ['required', 'string', 'max:100', 'regex:/^[\p{Arabic}A-Za-z0-9 _\-]+$/u', Rule::unique('roles', 'name')->ignore($ignoreId)],
            'dashboard' => ['required', Rule::in(array_keys(self::DASHBOARDS))],
            // مسار قديم: قائمة صلاحيات صريحة (مصفوفة الأدوار القديمة)
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'name')],
            // مسار RBAC الجديد (طبق الأصل): وحدات + حقوق + رؤية + نطاق + اعتماد + تواصل
            'modules' => ['array'],
            'modules.*' => ['string'],
            'rights' => ['array'],
            'visibility' => ['array'],
            'scope' => ['array'],
            'approval_authority' => ['boolean'],
            'chat' => ['array'],
        ], [
            'name.regex' => 'اسم الدور يقبل حروفًا عربية أو إنجليزية وأرقامًا ومسافات فقط.',
            'dashboard.required' => 'حدّد نوع الدور (لوحة الإدارة / بوابة الموظف / بوابة العميل).',
        ]);

        // إعدادات RBAC (تُخزَّن كما هي للعرض؛ والوحدات/الحقوق/الرؤية تُزامَن مع صلاحيات spatie).
        // دمج صريح لكل مفتاح (لا array_replace_recursive) حتى لا تُدمج القوائم كـ chat.types
        // عنصرًا بعنصر — فإلغاء تحديد كل الأنواع يجب أن يُخزَّن قائمة فارغة لا الافتراضي.
        $def = $this->defaultSettings();
        $settings = [
            'rights' => array_replace($def['rights'], array_intersect_key($validated['rights'] ?? [], $def['rights'])),
            'visibility' => array_replace($def['visibility'], array_intersect_key($validated['visibility'] ?? [], $def['visibility'])),
            'scope' => array_replace($def['scope'], array_intersect_key($validated['scope'] ?? [], $def['scope'])),
            'approval_authority' => (bool) ($validated['approval_authority'] ?? false),
            'chat' => [
                'types' => array_values(array_filter((array) ($validated['chat']['types'] ?? []), 'is_string')),
                'restrict' => is_string($validated['chat']['restrict'] ?? null) ? $validated['chat']['restrict'] : 'none',
            ],
        ];

        // إن أُرسلت وحدات RBAC نبني الصلاحيات منها؛ وإلا نستخدم قائمة الصلاحيات الصريحة (القديمة).
        $isRbac = $request->has('modules');
        $permissions = $isRbac
            ? $this->permissionsFromRbac(array_merge($validated, ['rights' => $settings['rights'], 'visibility' => $settings['visibility']]), $validated['dashboard'])
            : ($validated['permissions'] ?? []);

        return [
            'name' => trim($validated['name']),
            'dashboard' => $validated['dashboard'],
            'permissions' => $permissions,
            'settings' => $isRbac ? $settings : null,
        ];
    }
}
