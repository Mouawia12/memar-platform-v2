<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * تحكّم الأدمن في ظهور أقسام/عناصر السايدبار لكل دور (طلب أيمن 2026-08-17).
 */
class RoleNavVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_sets_role_nav_hidden_and_dedupes(): void
    {
        $this->actingAsUserWith(['users.view', 'users.manage']);
        $role = Role::findOrCreate('emp_x', 'web');

        $this->patchJson("/api/v1/roles/{$role->id}/nav-visibility", ['nav_hidden' => ['pricing', 'crm', 'crm', 'accounts']])
            ->assertOk()
            ->assertJsonPath('data.nav_hidden', ['pricing', 'crm', 'accounts']);

        $this->assertSame(['pricing', 'crm', 'accounts'], $role->fresh()->getAttribute('settings')['nav_hidden']);
    }

    public function test_viewer_cannot_set_nav_visibility(): void
    {
        $this->actingAsUserWith(['users.view']); // بلا users.manage
        $role = Role::findOrCreate('emp_y', 'web');

        $this->patchJson("/api/v1/roles/{$role->id}/nav-visibility", ['nav_hidden' => ['crm']])->assertForbidden();
    }

    public function test_user_receives_role_nav_hidden_intersection(): void
    {
        Role::findOrCreate('r_hide', 'web')->update(['settings' => ['nav_hidden' => ['pricing', 'accounts']]]);
        Role::findOrCreate('r_show', 'web')->update(['settings' => ['nav_hidden' => ['pricing']]]);

        // مستخدم بدورٍ واحد يُخفي pricing + accounts → يستلمهما.
        $solo = User::factory()->create();
        $solo->assignRole('r_hide');
        $data = $this->actingAs($solo)->getJson('/api/v1/auth/me')->assertOk()->json('data.role_nav_hidden');
        sort($data);
        $this->assertSame(['accounts', 'pricing'], $data);

        // مستخدم بدورين: يُخفى العنصر فقط إن أخفاه الدوران (تقاطع) → pricing فقط.
        $dual = User::factory()->create();
        $dual->assignRole(['r_hide', 'r_show']);
        $this->assertSame(['pricing'], $this->actingAs($dual)->getJson('/api/v1/auth/me')->assertOk()->json('data.role_nav_hidden'));
    }

    public function test_catalog_exposes_nav_hidden(): void
    {
        $this->actingAsUserWith(['users.view']);
        Role::findOrCreate('r_cat', 'web')->update(['settings' => ['nav_hidden' => ['crm']]]);

        $roles = $this->getJson('/api/v1/roles/catalog')->assertOk()->json('data');
        $target = collect($roles)->firstWhere('name', 'r_cat');
        $this->assertSame(['crm'], $target['nav_hidden']);
    }
}
