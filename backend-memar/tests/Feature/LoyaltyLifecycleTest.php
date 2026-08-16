<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Services\LoyaltyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoyaltyLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_earned_points_are_pending_until_approved(): void
    {
        $this->actingAsUserWith(['loyalty.manage', 'loyalty.view']);
        $emp = User::factory()->create();

        // منح نقاط «مستحقة» (بعد التعاقد، تنتظر الاعتماد)
        $award = $this->postJson("/api/v1/loyalty/employees/{$emp->id}/award", [
            'points' => 100, 'description' => 'تعاقد فرصة', 'status' => 'earned',
        ])->assertCreated();

        $txId = $award->json('data.id');

        // قبل الاعتماد: مستحقة 100، متاح 0
        $wallet = $this->getJson("/api/v1/loyalty/employees/{$emp->id}/wallet")->assertOk();
        $this->assertSame(100, $wallet->json('data.by_status.earned'));
        $this->assertSame(0, $wallet->json('data.by_status.available'));
        $this->assertSame(0, $wallet->json('data.balance'));

        // اعتماد الإدارة → متاح
        $this->postJson("/api/v1/loyalty/transactions/{$txId}/approve")->assertOk();

        $wallet = $this->getJson("/api/v1/loyalty/employees/{$emp->id}/wallet")->assertOk();
        $this->assertSame(0, $wallet->json('data.by_status.earned'));
        $this->assertSame(100, $wallet->json('data.by_status.available'));
        $this->assertSame(100, $wallet->json('data.balance'));
    }

    public function test_manual_deduct_and_cancel(): void
    {
        $this->actingAsUserWith(['loyalty.manage', 'loyalty.view']);
        $emp = User::factory()->create();
        $loyalty = app(LoyaltyService::class);

        $loyalty->awardUser($emp, 100, 'adjust', null, 'رصيد ابتدائي'); // available

        // خصم يدوي 30 → متاح 70
        $this->postJson("/api/v1/loyalty/employees/{$emp->id}/award", [
            'points' => -30, 'description' => 'تسوية',
        ])->assertCreated();
        $this->assertSame(70, $loyalty->userAvailableBalance($emp));

        // إلغاء منحة معلّقة لا يؤثّر على المتاح
        $pending = $loyalty->awardUser($emp, 40, 'adjust', null, 'معلّقة', \App\Models\LoyaltyTransaction::STATUS_PENDING);
        $this->assertSame(40, $loyalty->userPointsByStatus($emp)['pending']);

        $this->postJson("/api/v1/loyalty/transactions/{$pending->id}/cancel")->assertOk();
        $this->assertSame(0, $loyalty->userPointsByStatus($emp)['pending']);
        $this->assertSame(70, $loyalty->userAvailableBalance($emp));
    }

    public function test_earned_points_not_convertible_to_salary(): void
    {
        $emp = $this->actingAsUserWith(['self.view']);
        $loyalty = app(LoyaltyService::class);

        // نقاط مستحقة فقط (لم تُعتمد)
        $loyalty->awardUser($emp, 500, 'adjust', null, 'مستحقة', \App\Models\LoyaltyTransaction::STATUS_EARNED);

        // المتاح 0 → التحويل يفشل رغم وجود 500 مستحقة
        $this->postJson('/api/v1/auth/me/points/convert', ['points' => 50])
            ->assertStatus(422);
    }

    public function test_non_manager_cannot_award(): void
    {
        $this->actingAsUserWith(['self.view']);
        $emp = User::factory()->create();

        $this->postJson("/api/v1/loyalty/employees/{$emp->id}/award", [
            'points' => 10, 'description' => 'x',
        ])->assertForbidden();
    }
}
