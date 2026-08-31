<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * استثناءات الموظف (طلب أيمن 2026-08-31): صلاحية مباشرة فوق دوره، تخصّه وحده
 * ولا تمسّ زملاءه في الدور نفسه.
 */
class UserPermissionExceptionsTest extends TestCase
{
    use RefreshDatabase;

    /** @param array<int, string> $names */
    private function perms(array $names): void
    {
        foreach ($names as $n) {
            Permission::findOrCreate($n, 'web');
        }
    }

    private function engineer(string $email): User
    {
        $this->perms(['tasks.view', 'tasks.manage', 'pricing.view', 'finance.view']);
        $role = Role::findOrCreate('مهندس تصميم', 'web');
        $role->syncPermissions(['tasks.view', 'tasks.manage']);

        $user = User::factory()->create(['email' => $email]);
        $user->assignRole('مهندس تصميم');

        return $user;
    }

    public function test_permissions_endpoint_separates_role_from_exception(): void
    {
        $this->actingAsUserWith(['users.view', 'users.manage']);
        $user = $this->engineer('eng1@memar.kw');

        $this->putJson("/api/v1/users/{$user->id}/permissions", ['permissions' => ['pricing.view']])
            ->assertOk()
            ->assertJsonPath('message', 'تم تحديث صلاحيات الموظف الاستثنائية');

        $body = $this->getJson("/api/v1/users/{$user->id}/permissions")->assertOk()->json('data');

        $this->assertSame(['مهندس تصميم'], $body['roles']);
        $this->assertEqualsCanonicalizing(['tasks.view', 'tasks.manage'], $body['from_roles']);
        $this->assertSame(['pricing.view'], $body['direct']);
        $this->assertEqualsCanonicalizing(['tasks.view', 'tasks.manage', 'pricing.view'], $body['effective']);
    }

    public function test_exception_belongs_to_the_person_not_to_his_colleagues(): void
    {
        $this->actingAsUserWith(['users.view', 'users.manage']);
        $doaa = $this->engineer('doaa@memar.kw');
        $khaled = $this->engineer('khaled@memar.kw');

        $this->putJson("/api/v1/users/{$doaa->id}/permissions", ['permissions' => ['pricing.view']])->assertOk();

        $this->assertTrue($doaa->fresh()->can('pricing.view'));
        $this->assertFalse($khaled->fresh()->can('pricing.view')); // زميله في الدور نفسه لم يُمسّ
    }

    public function test_exceptions_can_be_cleared(): void
    {
        $this->actingAsUserWith(['users.view', 'users.manage']);
        $user = $this->engineer('eng2@memar.kw');
        $this->putJson("/api/v1/users/{$user->id}/permissions", ['permissions' => ['finance.view']])->assertOk();

        $this->putJson("/api/v1/users/{$user->id}/permissions", ['permissions' => []])
            ->assertOk()
            ->assertJsonPath('message', 'أُزيلت استثناءات هذا الموظف');

        $this->assertFalse($user->fresh()->can('finance.view'));
        $this->assertTrue($user->fresh()->can('tasks.view')); // ودوره لم يُمسّ
    }

    public function test_setting_exceptions_requires_users_manage(): void
    {
        $this->actingAsUserWith(['users.view']);
        $user = $this->engineer('eng3@memar.kw');

        $this->putJson("/api/v1/users/{$user->id}/permissions", ['permissions' => ['pricing.view']])
            ->assertForbidden();
    }

    public function test_unknown_permission_is_rejected(): void
    {
        $this->actingAsUserWith(['users.view', 'users.manage']);
        $user = $this->engineer('eng4@memar.kw');

        $this->putJson("/api/v1/users/{$user->id}/permissions", ['permissions' => ['nope.view']])
            ->assertStatus(422);
    }
}
