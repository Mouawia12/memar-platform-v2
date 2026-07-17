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
    /** تسميات عربية للأدوار المعروفة. */
    private const ROLE_LABELS = [
        'super_admin' => 'مدير عام',
        'manager' => 'مدير',
        'architect' => 'مهندس معماري',
        'accountant' => 'محاسب',
        'hr_manager' => 'مدير موارد بشرية',
        'client' => 'عميل',
    ];

    /** تسميات عربية لمجموعات الصلاحيات. */
    private const GROUP_LABELS = [
        'crm' => 'العملاء والعلاقات',
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
    ];

    /** قائمة الأدوار (للاختيار في نماذج المستخدمين). */
    public function index(): JsonResponse
    {
        $roles = Role::orderBy('id')->get()->map(fn (Role $role): array => [
            'name' => $role->name,
            'label' => self::ROLE_LABELS[$role->name] ?? $role->name,
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
                'is_system' => array_key_exists($role->name, self::ROLE_LABELS),
                'users_count' => (int) ($counts[$role->id] ?? 0),
                'permissions' => $role->permissions->pluck('name')->all(),
            ]);

        return $this->ok($roles);
    }

    /** كل الصلاحيات مجمّعة حسب الوحدة. */
    public function permissions(): JsonResponse
    {
        $groups = Permission::orderBy('name')->get()
            ->groupBy(fn (Permission $p): string => explode('.', (string) $p->name)[0])
            ->map(fn ($items, string $key): array => [
                'group' => $key,
                'label' => self::GROUP_LABELS[$key] ?? $key,
                'permissions' => $items->map(fn (Permission $p): array => [
                    'name' => $p->name,
                    'action' => str_ends_with((string) $p->name, '.manage') ? 'إدارة' : 'عرض',
                ])->values(),
            ])
            ->values();

        return $this->ok($groups);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateRole($request, null);

        $role = Role::create(['name' => $data['name'], 'guard_name' => 'web']);
        $role->syncPermissions($data['permissions']);

        return $this->created(['id' => $role->id], 'تم إنشاء الدور');
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        abort_if($role->name === 'super_admin', 403, 'لا يمكن تعديل دور المدير العام');

        $data = $this->validateRole($request, $role->id);

        $role->update(['name' => $data['name']]);
        $role->syncPermissions($data['permissions']);

        return $this->ok(['id' => $role->id], 'تم تحديث الدور وصلاحياته');
    }

    public function destroy(Role $role): JsonResponse
    {
        abort_if(array_key_exists($role->name, self::ROLE_LABELS), 403, 'لا يمكن حذف دور نظامي');
        abort_if($role->users()->exists(), 422, 'لا يمكن حذف دور مرتبط بمستخدمين');

        $role->delete();

        return $this->ok(null, 'تم حذف الدور');
    }

    /**
     * @return array{name: string, permissions: array<int, string>}
     */
    private function validateRole(Request $request, ?int $ignoreId): array
    {
        /** @var array{name: string, permissions?: array<int, string>} $validated */
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'regex:/^[a-z_]+$/', Rule::unique('roles', 'name')->ignore($ignoreId)],
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'name')],
        ], [
            'name.regex' => 'اسم الدور يجب أن يكون بأحرف إنجليزية صغيرة وشرطة سفلية فقط (مثل: project_manager).',
        ]);

        return ['name' => $validated['name'], 'permissions' => $validated['permissions'] ?? []];
    }
}
