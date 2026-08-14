<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * إنفاذ إعدادات RBAC الدقيقة (النطاق + التواصل) القادمة من شاشة الأدوار على مستوى الـAPI.
 * طلب أيمن 2026-08-13: «طبق الأصل كامل ووظيفي» — الإعدادات يجب أن تنعكس فعليًا لا شكلًا فقط.
 */
class RbacEnforcementTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @param  array<int, string>  $permissions
     */
    private function roleWithSettings(string $name, ?array $settings, array $permissions = []): Role
    {
        foreach ($permissions as $p) {
            Permission::findOrCreate($p, 'web');
        }
        $role = Role::create(['name' => $name, 'guard_name' => 'web']);
        if ($settings !== null) {
            $role->settings = $settings;
            $role->save();
        }
        $role->givePermissionTo($permissions);

        return $role;
    }

    private function actingStaffWithRole(Role $role): User
    {
        $user = User::factory()->create(['is_active' => true, 'contact_id' => null]);
        $user->assignRole($role);
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_project_scope_assigned_limits_list_to_managed_or_member_projects(): void
    {
        $role = $this->roleWithSettings('مهندس تجريبي', ['scope' => ['projects' => 'assigned']], ['projects.view']);
        $user = $this->actingStaffWithRole($role);

        $managed = Project::factory()->create(['manager_id' => $user->id]);
        $member = Project::factory()->create();
        $member->members()->attach($user->id, ['assigned_at' => now()]);
        $other = Project::factory()->create(); // لا يديره ولا عضو فيه

        $ids = collect($this->getJson('/api/v1/projects')->assertOk()->json('data'))->pluck('id')->all();

        $this->assertContains($managed->id, $ids);
        $this->assertContains($member->id, $ids);
        $this->assertNotContains($other->id, $ids, 'المشروع غير المُسنَد يجب ألا يظهر لدور نطاقه assigned');
    }

    public function test_admin_role_sees_all_projects_regardless_of_scope(): void
    {
        // «admin» دور نظامي ⇒ نطاق all دائمًا حتى لو حُفظ خلاف ذلك.
        $role = $this->roleWithSettings('admin', ['scope' => ['projects' => 'own']], ['projects.view']);
        $this->actingStaffWithRole($role);

        Project::factory()->count(3)->create();

        $this->getJson('/api/v1/projects')->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_role_without_stored_settings_is_unrestricted(): void
    {
        $role = $this->roleWithSettings('مشرف عام', null, ['projects.view']);
        $this->actingStaffWithRole($role);

        Project::factory()->count(3)->create();

        $this->getJson('/api/v1/projects')->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_chat_types_restricts_staff_list_to_allowed_account_types(): void
    {
        $role = $this->roleWithSettings('سكرتير تجريبي', ['chat' => ['types' => ['management'], 'restrict' => 'none']]);
        $this->actingStaffWithRole($role);

        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $manager = User::factory()->create(['is_active' => true, 'contact_id' => null]);
        $manager->assignRole($adminRole);
        $employee = User::factory()->create(['is_active' => true, 'contact_id' => null]);

        $ids = collect($this->getJson('/api/v1/chat/staff')->assertOk()->json('data'))->pluck('id')->all();

        $this->assertContains($manager->id, $ids, 'الإدارة مسموح التواصل معها');
        $this->assertNotContains($employee->id, $ids, 'الموظف العادي خارج أنواع التواصل المسموحة');
    }

    public function test_chat_types_blocks_creating_conversation_with_disallowed_type(): void
    {
        $role = $this->roleWithSettings('سكرتير تجريبي', ['chat' => ['types' => ['management'], 'restrict' => 'none']]);
        $this->actingStaffWithRole($role);

        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $manager = User::factory()->create(['is_active' => true, 'contact_id' => null]);
        $manager->assignRole($adminRole);
        $employee = User::factory()->create(['is_active' => true, 'contact_id' => null]);

        // موظف عادي (employees) خارج المسموح ⇒ 422
        $this->postJson('/api/v1/chat/conversations', ['type' => 'direct', 'user_id' => $employee->id])
            ->assertStatus(422);

        // الإدارة (management) مسموحة ⇒ إنشاء ناجح
        $this->postJson('/api/v1/chat/conversations', ['type' => 'direct', 'user_id' => $manager->id])
            ->assertCreated();
    }

    public function test_unrestricted_role_can_chat_with_everyone(): void
    {
        // دور بلا إعدادات محفوظة ⇒ types = ['all'] ضمنيًا.
        $role = $this->roleWithSettings('موظف مفتوح', null);
        $this->actingStaffWithRole($role);

        $employee = User::factory()->create(['is_active' => true, 'contact_id' => null]);

        $ids = collect($this->getJson('/api/v1/chat/staff')->assertOk()->json('data'))->pluck('id')->all();
        $this->assertContains($employee->id, $ids);
    }
}
