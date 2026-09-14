<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * حقوق كل وحدة على حدة (طلب أيمن 2026-08-31): كان «التعديل» و«الحذف» مفتاحين
 * عامّين يسريان على كل الوحدات المؤشَّرة، فيستحيل التعبير عن «يرى المشاريع
 * ويعدّل المهام» — وهو جوهر تمييز صلاحيات كل موظف.
 */
class RoleModuleRightsTest extends TestCase
{
    use RefreshDatabase;

    /** @param array<int, string> $names */
    private function perms(array $names): void
    {
        foreach ($names as $n) {
            Permission::findOrCreate($n, 'web');
        }
    }

    public function test_each_module_gets_its_own_rights(): void
    {
        $this->perms([
            'projects.view', 'projects.manage', 'projects.delete',
            'tasks.view', 'tasks.manage', 'tasks.delete',
            'documents.view', 'documents.manage', 'documents.delete',
        ]);
        $this->actingAsUserWith(['users.manage']);

        $this->postJson('/api/v1/roles', [
            'name' => 'مهندس تصميم',
            'dashboard' => 'employee',
            'modules' => ['projects', 'tasks', 'documents'],
            'module_rights' => [
                'projects' => ['manage' => false, 'delete' => false], // يرى المشاريع فقط
                'tasks' => ['manage' => true, 'delete' => false],      // ويعدّل المهام
                'documents' => ['manage' => true, 'delete' => true],   // ويملك المستندات كاملةً
            ],
        ])->assertCreated();

        $role = Role::where('name', 'مهندس تصميم')->firstOrFail();
        $granted = $role->permissions->pluck('name')->sort()->values()->all();

        $this->assertSame([
            'documents.delete', 'documents.manage', 'documents.view',
            'projects.view',
            'tasks.manage', 'tasks.view',
        ], $granted);
    }

    public function test_rights_matrix_is_returned_in_the_catalog(): void
    {
        $this->perms(['tasks.view', 'tasks.manage', 'projects.view']);
        $this->actingAsUserWith(['users.view', 'users.manage']);

        $this->postJson('/api/v1/roles', [
            'name' => 'رسّام',
            'dashboard' => 'employee',
            'modules' => ['tasks', 'projects'],
            'module_rights' => ['tasks' => ['manage' => true], 'projects' => ['manage' => false]],
        ])->assertCreated();

        $role = collect($this->getJson('/api/v1/roles/catalog')->assertOk()->json('data'))
            ->firstWhere('name', 'رسّام');

        $this->assertTrue($role['rbac']['module_rights']['tasks']['manage']);
        $this->assertFalse($role['rbac']['module_rights']['projects']['manage']);
    }

    public function test_role_saved_before_the_matrix_keeps_its_exact_permissions(): void
    {
        $this->perms(['tasks.view', 'tasks.manage', 'projects.view']);
        $this->actingAsUserWith(['users.view']);

        // دور قديم: صلاحيات دقيقة بلا إعدادات محفوظة
        $role = Role::findOrCreate('دور قديم', 'web');
        $role->dashboard = 'employee';
        $role->save();
        $role->syncPermissions(['tasks.view', 'tasks.manage', 'projects.view']);

        $catalog = collect($this->getJson('/api/v1/roles/catalog')->assertOk()->json('data'))
            ->firstWhere('name', 'دور قديم');

        // تُشتقّ المصفوفة من صلاحياته الفعلية: لا تعميم يمنحه ما لا يملك
        $this->assertTrue($catalog['rbac']['module_rights']['tasks']['manage']);
        $this->assertFalse($catalog['rbac']['module_rights']['projects']['manage']);
        $this->assertFalse($catalog['rbac']['module_rights']['tasks']['delete']);
    }
}
