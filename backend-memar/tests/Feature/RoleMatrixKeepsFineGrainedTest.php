<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * شكوى أيمن (فيديو 2026-09-17): «لما خفيت عميل جديد بدأت العقود تختفي… في حاجات
 * لما بخفيها بتخفي حاجات تانية». السبب: كل حفظ لمصفوفة الصلاحيات كان يبني صلاحيات
 * الدور من ثلاثة أفعال لكل وحدة ثم يستبدل الكل، فتُمحى الصلاحيات الأدقّ صامتةً.
 * ومعها: سجل المشاريع يفتح على «كل المشاريع» لكل الأدوار.
 */
class RoleMatrixKeepsFineGrainedTest extends TestCase
{
    use RefreshDatabase;

    private function perms(array $names): void
    {
        foreach ($names as $n) {
            Permission::findOrCreate($n, 'web');
        }
    }

    /** @param array<int, string> $modules */
    private function saveMatrix(Role $role, array $modules): void
    {
        $this->putJson("/api/v1/roles/{$role->id}", [
            'name' => $role->name,
            'dashboard' => 'employee',
            'modules' => $modules,
            'module_rights' => collect($modules)->mapWithKeys(fn (string $m): array => [$m => ['manage' => false, 'delete' => false]])->all(),
            'rights' => ['view' => 'all', 'edit' => 'none', 'delete' => false],
            'visibility' => ['pricing' => 'none', 'financial' => 'none'],
            'approval_authority' => false,
            'chat' => ['types' => ['all'], 'restrict' => 'none'],
        ])->assertOk();
    }

    private function roleWith(array $permissions): Role
    {
        $this->perms($permissions);
        $role = Role::findOrCreate('مهندس تصميم', 'web');
        $role->dashboard = 'employee';
        $role->save();
        $role->syncPermissions($permissions);

        return $role;
    }

    public function test_fine_grained_permissions_survive_a_matrix_save(): void
    {
        $this->actingAsUserWith(['users.view', 'users.manage']);
        $role = $this->roleWith(['crm.view', 'clients.view', 'clients.finance.view', 'documents.view', 'documents.view.all', 'contracts.view']);

        // الأدمن يلغي «عميل جديد» وحدها ويُبقي الباقي
        $this->saveMatrix($role, ['clients', 'documents', 'contracts']);

        $after = $role->fresh()->permissions->pluck('name')->all();
        $this->assertNotContains('crm.view', $after, 'الوحدة الملغاة تسقط');
        $this->assertContains('contracts.view', $after, 'العقود لا تسقط مع إلغاء وحدة أخرى');
        $this->assertContains('clients.finance.view', $after, 'إجمالي عقود العميل لا يُمحى صامتًا');
        $this->assertContains('documents.view.all', $after, 'رؤية ملفات المكتب كلها لا تُمحى صامتًا');
    }

    public function test_fine_grained_drops_with_its_own_module(): void
    {
        $this->actingAsUserWith(['users.view', 'users.manage']);
        $role = $this->roleWith(['clients.view', 'clients.finance.view', 'documents.view', 'documents.view.all']);

        $this->saveMatrix($role, ['documents']);   // أُلغيت وحدة «ملف العميل» كاملةً

        $after = $role->fresh()->permissions->pluck('name')->all();
        $this->assertNotContains('clients.finance.view', $after, 'إلغاء الوحدة الأمّ يُسقط صلاحيتها الدقيقة');
        $this->assertContains('documents.view.all', $after);
    }

    public function test_saving_the_matrix_no_longer_locks_the_role_into_its_own_projects(): void
    {
        $this->actingAsUserWith(['users.view', 'users.manage']);
        $role = $this->roleWith(['projects.view']);

        $this->saveMatrix($role, ['projects']);

        $this->assertSame('all', data_get($role->fresh()->getAttribute('settings'), 'scope.projects'));
    }

    public function test_employee_sees_every_project_with_its_manager(): void
    {
        $this->perms(['projects.view']);
        $role = $this->roleWith(['projects.view']);
        $employee = User::factory()->create();
        $employee->assignRole($role);
        $other = User::factory()->create(['name' => 'م. أحمد فوزي']);

        Project::create(['name' => 'مشروعه', 'status' => 'active', 'manager_id' => $employee->id]);
        Project::create(['name' => 'مشروع غيره', 'status' => 'active', 'manager_id' => $other->id]);

        $this->actingAs($employee);
        $rows = $this->getJson('/api/v1/projects')->assertOk()->json('data');

        $this->assertCount(2, $rows, 'الموظف يرى كل المشاريع لا مشاريعه وحدها');
        $names = array_column($rows, 'name');
        $this->assertContains('مشروع غيره', $names);
        $managers = array_map(fn (array $r): ?string => $r['manager']['name'] ?? null, $rows);
        $this->assertContains('م. أحمد فوزي', $managers, 'اسم المسؤول ظاهر أمام كل مشروع');
    }

    public function test_mine_filter_narrows_to_my_projects(): void
    {
        $this->perms(['projects.view']);
        $role = $this->roleWith(['projects.view']);
        $employee = User::factory()->create();
        $employee->assignRole($role);
        $other = User::factory()->create();

        Project::create(['name' => 'مشروعه', 'status' => 'active', 'manager_id' => $employee->id]);
        Project::create(['name' => 'مشروع غيره', 'status' => 'active', 'manager_id' => $other->id]);

        $this->actingAs($employee);
        $rows = $this->getJson('/api/v1/projects?mine=1')->assertOk()->json('data');

        $this->assertSame(['مشروعه'], array_column($rows, 'name'));
    }
}
