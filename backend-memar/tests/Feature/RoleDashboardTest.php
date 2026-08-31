<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * نظام الأدوار المبسّط (طلب أيمن 2026-08-12): كل دور له نوع لوحة (admin/employee/client)
 * يحدّد وجهته وأي صلاحيات تخصّه؛ الاسم يقبل العربية؛ والصلاحيات تُقصّ على نوع اللوحة.
 */
class RoleDashboardTest extends TestCase
{
    use RefreshDatabase;

    private function perms(array $names): void
    {
        foreach ($names as $n) {
            Permission::findOrCreate($n, 'web');
        }
    }

    public function test_creating_role_requires_a_dashboard_type(): void
    {
        $this->actingAsUserWith(['users.manage']);

        $this->postJson('/api/v1/roles', ['name' => 'دور بلا نوع', 'permissions' => []])
            ->assertStatus(422)
            ->assertJsonValidationErrors('dashboard');
    }

    public function test_role_name_accepts_arabic(): void
    {
        $this->perms(['finance.view']);
        $this->actingAsUserWith(['users.manage']);

        $this->postJson('/api/v1/roles', [
            'name' => 'محاسب مشاريع',
            'dashboard' => 'admin',
            'permissions' => ['finance.view'],
        ])->assertCreated();

        $this->assertDatabaseHas('roles', ['name' => 'محاسب مشاريع', 'dashboard' => 'admin']);
    }

    /**
     * القاعدة الجديدة (طلب أيمن 2026-08-31): الوجهة تقرّر أين يهبط المستخدم لا
     * ماذا يملك. فدور «محاسب» في بوابة الموظف يملك المالية، ولا يُقصّ منه إلا
     * ما هو إدارةٌ للنظام نفسه (المستخدمون والأدوار والإعدادات).
     */
    public function test_employee_role_may_hold_operational_permissions(): void
    {
        $this->perms(['finance.view', 'tasks.view', 'hr.view', 'leads.view', 'loyalty.view', 'clients.view']);
        $this->actingAsUserWith(['users.manage']);

        $this->postJson('/api/v1/roles', [
            'name' => 'محاسب البوابة',
            'dashboard' => 'employee',
            'permissions' => ['finance.view', 'tasks.view', 'hr.view', 'leads.view', 'loyalty.view', 'clients.view'],
        ])->assertCreated();

        $role = Role::where('name', 'محاسب البوابة')->firstOrFail();
        foreach (['finance.view', 'tasks.view', 'hr.view', 'leads.view', 'loyalty.view', 'clients.view'] as $perm) {
            $this->assertTrue($role->hasPermissionTo($perm), "توقّعنا أن يحمل الدور {$perm}");
        }
    }

    public function test_employee_role_still_cannot_hold_system_administration(): void
    {
        $this->perms(['users.manage', 'roles.manage', 'settings.manage', 'tasks.view']);
        $this->actingAsUserWith(['users.manage']);

        $this->postJson('/api/v1/roles', [
            'name' => 'مساعد',
            'dashboard' => 'employee',
            'permissions' => ['users.manage', 'roles.manage', 'settings.manage', 'tasks.view'],
        ])->assertCreated();

        $role = Role::where('name', 'مساعد')->firstOrFail();
        $this->assertTrue($role->hasPermissionTo('tasks.view'));
        foreach (['users.manage', 'roles.manage', 'settings.manage'] as $perm) {
            $this->assertFalse($role->hasPermissionTo($perm), "إدارة النظام لا تُمنح لوجهة الموظف: {$perm}");
        }
    }

    public function test_user_dashboard_resolves_from_role_type(): void
    {
        $role = Role::findOrCreate('employee', 'web');
        $role->dashboard = 'employee';
        $role->save();

        $user = User::factory()->create();
        $user->assignRole('employee');
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.dashboard', 'employee');
    }

    public function test_admin_dashboard_wins_when_user_has_multiple_roles(): void
    {
        foreach (['admin' => 'admin', 'employee' => 'employee'] as $name => $dash) {
            $r = Role::findOrCreate($name, 'web');
            $r->dashboard = $dash;
            $r->save();
        }

        $user = User::factory()->create();
        $user->assignRole(['admin', 'employee']);
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/me')->assertJsonPath('data.dashboard', 'admin');
    }
}
