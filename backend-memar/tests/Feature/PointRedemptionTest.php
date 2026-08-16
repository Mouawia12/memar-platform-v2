<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\PointRedemptionRequest;
use App\Models\User;
use App\Services\LoyaltyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PointRedemptionTest extends TestCase
{
    use RefreshDatabase;

    /** موظف مصادَق عليه مع سجل HR ورصيد نقاط متاح. */
    private function employeeWithPoints(int $points): User
    {
        $user = $this->actingAsUserWith(['self.view']);
        Employee::create(['user_id' => $user->id, 'full_name' => $user->name, 'base_salary_kwd' => 500, 'status' => 'active']);
        app(LoyaltyService::class)->awardUser($user, $points, 'adjust', null, 'رصيد اختبار'); // available
        return $user;
    }

    public function test_request_creates_pending_without_deducting(): void
    {
        $user = $this->employeeWithPoints(200);

        $this->postJson('/api/v1/auth/me/points/convert', ['points' => 100])
            ->assertCreated()->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('point_redemption_requests', ['user_id' => $user->id, 'points' => 100, 'status' => 'pending']);
        // لم تُخصم النقاط بعد
        $this->assertSame(200, app(LoyaltyService::class)->userAvailableBalance($user));
    }

    public function test_request_over_available_rejected(): void
    {
        $this->employeeWithPoints(80);

        $this->postJson('/api/v1/auth/me/points/convert', ['points' => 150])->assertStatus(422);
    }

    public function test_pending_reserves_points(): void
    {
        $this->employeeWithPoints(150);

        $this->postJson('/api/v1/auth/me/points/convert', ['points' => 100])->assertCreated();
        // المتبقّي المتاح 50 فقط → طلب 100 آخر يُرفض
        $this->postJson('/api/v1/auth/me/points/convert', ['points' => 100])->assertStatus(422);
    }

    public function test_min_points_enforced(): void
    {
        $this->employeeWithPoints(200);
        // أقل استبدال 50 نقطة (config)
        $this->postJson('/api/v1/auth/me/points/convert', ['points' => 40])->assertStatus(422);
    }

    public function test_approve_deducts_and_posts_to_payroll(): void
    {
        $user = $this->employeeWithPoints(200);
        $this->postJson('/api/v1/auth/me/points/convert', ['points' => 100])->assertCreated();
        $req = PointRedemptionRequest::first();

        $this->actingAsUserWith(['loyalty.manage', 'loyalty.view']);
        $this->postJson("/api/v1/loyalty/redemptions/{$req->id}/approve")->assertOk();

        $req->refresh();
        $this->assertSame('approved', $req->status);
        $this->assertNotNull($req->salary_id);
        // خُصمت النقاط: 200 - 100 = 100
        $this->assertSame(100, app(LoyaltyService::class)->userAvailableBalance($user));
        // قُيّدت 2 د.ك (100/50) في allowances
        $this->assertDatabaseHas('salaries', ['id' => $req->salary_id, 'allowances_kwd' => '2.000']);
    }

    public function test_reject_leaves_balance_untouched(): void
    {
        $user = $this->employeeWithPoints(200);
        $this->postJson('/api/v1/auth/me/points/convert', ['points' => 100])->assertCreated();
        $req = PointRedemptionRequest::first();

        $this->actingAsUserWith(['loyalty.manage']);
        $this->postJson("/api/v1/loyalty/redemptions/{$req->id}/reject", ['reason' => 'غير مستوفٍ'])->assertOk();

        $this->assertSame('rejected', $req->fresh()->status);
        $this->assertSame(200, app(LoyaltyService::class)->userAvailableBalance($user));
    }

    public function test_non_manager_cannot_approve(): void
    {
        $this->employeeWithPoints(200);
        $this->postJson('/api/v1/auth/me/points/convert', ['points' => 100])->assertCreated();
        $req = PointRedemptionRequest::first();

        $this->actingAsUserWith(['self.view']);
        $this->postJson("/api/v1/loyalty/redemptions/{$req->id}/approve")->assertForbidden();
    }
}
