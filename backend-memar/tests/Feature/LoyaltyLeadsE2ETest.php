<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Employee;
use App\Models\LoyaltyRule;
use App\Models\LoyaltyTransaction;
use App\Models\PipelineStage;
use App\Models\PointRedemptionRequest;
use App\Models\Project;
use App\Models\User;
use App\Services\ContactService;
use App\Services\LoyaltyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * اختبار تكامل شامل للمسار الكامل (المرحلة 8): إحالة → عميل بخصم → فرصة → فوز →
 * نقاط مستحقة → اعتماد → متاحة → طلب استبدال → موافقة → قيد في الراتب. + حالات حدّية.
 */
class LoyaltyLeadsE2ETest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        PipelineStage::firstOrCreate(['key' => 'new'], ['label' => 'ج', 'color' => '#888', 'position' => 1, 'is_won' => false, 'is_lost' => false, 'is_protected' => true]);
        PipelineStage::firstOrCreate(['key' => 'won'], ['label' => 'ر', 'color' => '#059669', 'position' => 9, 'is_won' => true, 'is_lost' => false, 'is_protected' => true]);
        LoyaltyRule::create(['name' => 'كبير', 'min_value' => 2000, 'max_value' => null, 'points' => 50, 'is_active' => true, 'position' => 30]);
    }

    public function test_full_golden_path(): void
    {
        $loyalty = app(LoyaltyService::class);
        $svc = app(ContactService::class);

        // موظف بسجل HR
        $emp = User::factory()->create();
        Employee::create(['user_id' => $emp->id, 'full_name' => $emp->name, 'base_salary_kwd' => 500, 'status' => 'active']);

        // عميل مُحال بواسطة الموظف، وفرصته يملكها الموظف نفسه، قيمة 2500
        $lead = Contact::create([
            'full_name' => 'عميل مُحال', 'type' => 'lead', 'stage' => 'new',
            'owner_id' => $emp->id, 'referred_by_user_id' => $emp->id,
            'deal_value_kwd' => 2500, 'project_type' => 'villa',
        ]);

        // فوز → مشروع بخصم 10٪ (2250) + نقاط مستحقة من 2250 (قاعدة «كبير» = 50)
        $svc->update($lead, ['stage' => 'won']);

        $project = Project::where('client_id', $lead->id)->firstOrFail();
        $this->assertEqualsWithDelta(2250, (float) $project->budget_kwd, 0.001);
        $this->assertTrue($lead->fresh()->welcome_discount_used);

        $tx = LoyaltyTransaction::where('user_id', $emp->id)->where('source', 'referral_contracted')->firstOrFail();
        $this->assertSame(50, $tx->points);
        $this->assertSame(LoyaltyTransaction::STATUS_EARNED, $tx->status);
        $this->assertSame(0, $loyalty->userAvailableBalance($emp)); // مستحقة، غير متاحة بعد

        // اعتماد الإدارة → متاحة
        $this->actingAsUserWith(['loyalty.manage']);
        $this->postJson("/api/v1/loyalty/transactions/{$tx->id}/approve")->assertOk();
        $this->assertSame(50, $loyalty->userAvailableBalance($emp));

        // الموظف يطلب استبدال 50 نقطة (50/50 = 1 د.ك)
        $this->actingAs($emp);
        $this->postJson('/api/v1/auth/me/points/convert', ['points' => 50])->assertCreated();
        $req = PointRedemptionRequest::firstOrFail();

        // الإدارة تعتمد → خصم النقاط + قيد 1 د.ك في الراتب
        $this->actingAsUserWith(['loyalty.manage']);
        $this->postJson("/api/v1/loyalty/redemptions/{$req->id}/approve")->assertOk();

        $this->assertSame(0, $loyalty->userAvailableBalance($emp));
        $this->assertDatabaseHas('salaries', ['id' => $req->fresh()->salary_id, 'allowances_kwd' => '1.000']);
    }

    public function test_discount_not_repeated_across_customer_opportunities(): void
    {
        $svc = app(ContactService::class);
        $referrer = User::factory()->create();

        // العميل الموجود (مُحال)
        $customer = Contact::create(['full_name' => 'عميل', 'type' => 'client', 'stage' => 'new', 'referred_by_user_id' => $referrer->id]);

        // فرصة أولى مرتبطة بالعميل → خصم
        $opp1 = Contact::create(['full_name' => 'عميل', 'type' => 'lead', 'stage' => 'new', 'parent_contact_id' => $customer->id, 'deal_value_kwd' => 2000]);
        $svc->update($opp1, ['stage' => 'won']);
        $this->assertEqualsWithDelta(1800, (float) Project::where('client_id', $opp1->id)->value('budget_kwd'), 0.001);
        $this->assertTrue($customer->fresh()->welcome_discount_used);

        // فرصة ثانية لنفس العميل → لا خصم (المشروع الثاني)
        $opp2 = Contact::create(['full_name' => 'عميل', 'type' => 'lead', 'stage' => 'new', 'parent_contact_id' => $customer->id, 'deal_value_kwd' => 2000]);
        $svc->update($opp2, ['stage' => 'won']);
        $this->assertEqualsWithDelta(2000, (float) Project::where('client_id', $opp2->id)->value('budget_kwd'), 0.001);
    }

    public function test_cannot_approve_same_earned_points_twice(): void
    {
        $emp = User::factory()->create();
        $tx = app(LoyaltyService::class)->awardUser($emp, 30, 'adjust', null, 'x', LoyaltyTransaction::STATUS_EARNED);

        $this->actingAsUserWith(['loyalty.manage']);
        $this->postJson("/api/v1/loyalty/transactions/{$tx->id}/approve")->assertOk();
        // ثانيةً: لم تعُد مستحقة → 422
        $this->postJson("/api/v1/loyalty/transactions/{$tx->id}/approve")->assertStatus(422);
    }

    public function test_second_pending_redemption_fails_at_approval_when_balance_drained(): void
    {
        $emp = User::factory()->create();
        Employee::create(['user_id' => $emp->id, 'full_name' => $emp->name, 'base_salary_kwd' => 0, 'status' => 'active']);
        app(LoyaltyService::class)->awardUser($emp, 100, 'adjust', null, 'رصيد'); // available

        // طلبان معلّقان كلٌّ 50 (المتاح 100 يكفيهما معًا وقت الطلب)
        $this->actingAs($emp);
        $this->postJson('/api/v1/auth/me/points/convert', ['points' => 50])->assertCreated();
        $this->postJson('/api/v1/auth/me/points/convert', ['points' => 50])->assertCreated();
        $reqs = PointRedemptionRequest::orderBy('id')->get();

        $this->actingAsUserWith(['loyalty.manage']);
        $this->postJson("/api/v1/loyalty/redemptions/{$reqs[0]->id}/approve")->assertOk(); // خصم 50 → متاح 50
        $this->postJson("/api/v1/loyalty/redemptions/{$reqs[1]->id}/approve")->assertOk(); // متاح 50 يكفي 50
        $this->assertSame(0, app(LoyaltyService::class)->userAvailableBalance($emp));
    }
}
