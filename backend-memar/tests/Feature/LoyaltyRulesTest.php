<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\LoyaltyRule;
use App\Services\LoyaltyRuleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoyaltyRulesTest extends TestCase
{
    use RefreshDatabase;

    private function seedLadder(): void
    {
        LoyaltyRule::insert([
            ['name' => 'صغير', 'project_type' => null, 'min_value' => 500, 'max_value' => 999.999, 'points' => 10, 'is_active' => true, 'position' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'متوسط', 'project_type' => null, 'min_value' => 1000, 'max_value' => 1999.999, 'points' => 20, 'is_active' => true, 'position' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'كبير', 'project_type' => null, 'min_value' => 2000, 'max_value' => 2999.999, 'points' => 50, 'is_active' => true, 'position' => 30, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'مميز', 'project_type' => null, 'min_value' => 3000, 'max_value' => null, 'points' => 100, 'is_active' => true, 'position' => 40, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function test_points_for_resolves_by_value_range(): void
    {
        $this->seedLadder();
        $svc = app(LoyaltyRuleService::class);

        $this->assertSame(0, $svc->pointsFor(300));    // تحت أدنى نطاق
        $this->assertSame(10, $svc->pointsFor(500));   // حدّ سفلي
        $this->assertSame(20, $svc->pointsFor(1500));
        $this->assertSame(50, $svc->pointsFor(2000));
        $this->assertSame(100, $svc->pointsFor(9999));  // مفتوح للأعلى
    }

    public function test_type_specific_rule_beats_generic(): void
    {
        LoyaltyRule::insert([
            ['name' => 'عام', 'project_type' => null, 'min_value' => 0, 'max_value' => null, 'points' => 10, 'is_active' => true, 'position' => 5, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'فيلا', 'project_type' => 'villa', 'min_value' => 0, 'max_value' => null, 'points' => 40, 'is_active' => true, 'position' => 5, 'created_at' => now(), 'updated_at' => now()],
        ]);
        $svc = app(LoyaltyRuleService::class);

        $this->assertSame(40, $svc->pointsFor(1000, 'villa'));
        $this->assertSame(10, $svc->pointsFor(1000, 'office')); // لا قاعدة نوع → العامة
    }

    public function test_inactive_rule_ignored(): void
    {
        LoyaltyRule::create(['name' => 'معطّلة', 'min_value' => 0, 'max_value' => null, 'points' => 99, 'is_active' => false]);

        $this->assertSame(0, app(LoyaltyRuleService::class)->pointsFor(1000));
    }

    public function test_admin_can_crud_rules(): void
    {
        $this->actingAsUserWith(['loyalty.manage', 'loyalty.view']);

        $create = $this->postJson('/api/v1/loyalty/rules', [
            'name' => 'قاعدة', 'min_value' => 1000, 'max_value' => 2000, 'points' => 25,
        ])->assertCreated();

        $id = $create->json('data.id');
        $this->assertDatabaseHas('loyalty_rules', ['id' => $id, 'points' => 25]);

        $this->putJson("/api/v1/loyalty/rules/{$id}", ['points' => 30])->assertOk();
        $this->assertDatabaseHas('loyalty_rules', ['id' => $id, 'points' => 30]);

        $this->postJson('/api/v1/loyalty/rules/preview', ['value' => 1500])
            ->assertOk()->assertJsonPath('data.points', 30);

        $this->deleteJson("/api/v1/loyalty/rules/{$id}")->assertOk();
        $this->assertDatabaseMissing('loyalty_rules', ['id' => $id]);
    }

    public function test_max_value_must_be_gte_min(): void
    {
        $this->actingAsUserWith(['loyalty.manage']);

        $this->postJson('/api/v1/loyalty/rules', [
            'name' => 'خطأ', 'min_value' => 2000, 'max_value' => 1000, 'points' => 5,
        ])->assertStatus(422);
    }

    public function test_viewer_cannot_manage_rules(): void
    {
        $this->actingAsUserWith(['loyalty.view']);

        $this->postJson('/api/v1/loyalty/rules', ['name' => 'x', 'points' => 5])->assertForbidden();
    }
}
