<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\AppSetting;
use App\Services\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_apply_overrides_runtime_config(): void
    {
        AppSetting::create([
            'key' => 'loyalty.salary.points_per_kwd',
            'group' => 'loyalty',
            'value' => 77,
        ]);

        app(SettingsService::class)->apply();

        $this->assertSame(77, config('loyalty.salary.points_per_kwd'));
    }

    public function test_disallowed_group_is_not_applied_to_config(): void
    {
        // فضاء خارج ALLOWED_GROUPS يُخزَّن لكن لا يُطبَّق على config (حماية).
        AppSetting::create(['key' => 'app.injected_flag', 'group' => 'app', 'value' => 'HACKED']);

        app(SettingsService::class)->apply();

        $this->assertNull(config('app.injected_flag'));
    }

    public function test_admin_can_update_loyalty_settings(): void
    {
        $this->actingAsUserWith(['loyalty.manage']);

        $res = $this->putJson('/api/v1/settings/loyalty', [
            'settings' => ['salary.points_per_kwd' => 60, 'welcome_discount_pct' => 15],
        ]);

        $res->assertOk();
        $this->assertDatabaseHas('app_settings', ['key' => 'loyalty.salary.points_per_kwd']);
        $this->assertSame(60, $res->json('data.effective.salary.points_per_kwd'));
        $this->assertSame(15, $res->json('data.effective.welcome_discount_pct'));
    }

    public function test_show_returns_effective_and_overrides(): void
    {
        $this->actingAsUserWith(['loyalty.manage']);
        AppSetting::create(['key' => 'loyalty.redeem.min_points', 'group' => 'loyalty', 'value' => 250]);

        $res = $this->getJson('/api/v1/settings/loyalty');

        $res->assertOk();
        $this->assertSame(250, $res->json('data.effective.redeem.min_points'));
        $overrides = $res->json('data.overrides');
        $this->assertSame(250, $overrides['loyalty.redeem.min_points']);
    }

    public function test_unknown_group_returns_404(): void
    {
        $this->actingAsUserWith(['loyalty.manage']);

        $this->getJson('/api/v1/settings/hr')->assertNotFound();
    }

    public function test_invalid_key_is_rejected(): void
    {
        $this->actingAsUserWith(['loyalty.manage']);

        $this->putJson('/api/v1/settings/loyalty', [
            'settings' => ['bad key/with slash' => 1],
        ])->assertStatus(422);
    }

    public function test_non_manager_is_forbidden(): void
    {
        $this->actingAsUserWith(['self.view']);

        $this->getJson('/api/v1/settings/loyalty')->assertForbidden();
    }
}
