<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\LoyaltyRule;
use App\Models\LoyaltyTransaction;
use App\Models\PipelineStage;
use App\Models\Project;
use App\Models\User;
use App\Services\ContactService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OpportunityConversionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        PipelineStage::firstOrCreate(['key' => 'won'], ['label' => 'رابحة', 'color' => '#059669', 'position' => 9, 'is_won' => true, 'is_lost' => false, 'is_protected' => true]);
        LoyaltyRule::create(['name' => 'كبير', 'min_value' => 2000, 'max_value' => null, 'points' => 50, 'is_active' => true, 'position' => 30]);
        LoyaltyRule::create(['name' => 'متوسط', 'min_value' => 1000, 'max_value' => 1999.999, 'points' => 20, 'is_active' => true, 'position' => 20]);
    }

    private function svc(): ContactService
    {
        return app(ContactService::class);
    }

    public function test_win_awards_earned_points_from_final_price(): void
    {
        $owner = User::factory()->create();
        $lead = Contact::create(['full_name' => 'فرصة', 'type' => 'lead', 'stage' => 'new', 'owner_id' => $owner->id, 'deal_value_kwd' => 2500, 'project_type' => 'villa']);

        $this->svc()->update($lead, ['stage' => 'won']);

        // 2500 → قاعدة «كبير» = 50 نقطة، بحالة مستحقة (تنتظر الاعتماد)
        $tx = LoyaltyTransaction::where('user_id', $owner->id)->where('source', 'referral_contracted')->first();
        $this->assertNotNull($tx);
        $this->assertSame(50, $tx->points);
        $this->assertSame(LoyaltyTransaction::STATUS_EARNED, $tx->status);

        // المتاح 0 (مستحقة فقط) — لا تُحتسب في الرصيد القابل للتحويل قبل الاعتماد
        $this->assertSame(0, app(\App\Services\LoyaltyService::class)->userAvailableBalance($owner));
    }

    public function test_referred_customer_gets_first_project_discount(): void
    {
        $referrer = User::factory()->create();
        $lead = Contact::create([
            'full_name' => 'صديق مُحال', 'type' => 'lead', 'stage' => 'new',
            'deal_value_kwd' => 2000, 'referred_by_user_id' => $referrer->id,
        ]);

        $this->svc()->update($lead, ['stage' => 'won']);

        // خصم 10٪ على 2000 = 200؛ ميزانية المشروع = 1800
        $project = Project::where('client_id', $lead->id)->first();
        $this->assertNotNull($project);
        $this->assertEqualsWithDelta(1800, (float) $project->budget_kwd, 0.001);
        $this->assertTrue($lead->fresh()->welcome_discount_used);
        $this->assertEqualsWithDelta(200, (float) $lead->fresh()->welcome_discount_kwd, 0.001);
    }

    public function test_discount_not_repeated_and_not_for_non_referred(): void
    {
        // عميل غير مُحال → لا خصم
        $plain = Contact::create(['full_name' => 'عادي', 'type' => 'lead', 'stage' => 'new', 'deal_value_kwd' => 2000]);
        $this->svc()->update($plain, ['stage' => 'won']);
        $this->assertEqualsWithDelta(2000, (float) Project::where('client_id', $plain->id)->value('budget_kwd'), 0.001);
        $this->assertFalse($plain->fresh()->welcome_discount_used);

        // عميل مُحال استخدم الخصم سابقًا → لا يتكرّر
        $used = Contact::create(['full_name' => 'استُخدم', 'type' => 'lead', 'stage' => 'new', 'deal_value_kwd' => 2000, 'referred_by_user_id' => User::factory()->create()->id, 'welcome_discount_used' => true]);
        $this->svc()->update($used, ['stage' => 'won']);
        $this->assertEqualsWithDelta(2000, (float) Project::where('client_id', $used->id)->value('budget_kwd'), 0.001);
    }

    public function test_admin_approval_makes_earned_points_available(): void
    {
        $owner = User::factory()->create();
        $lead = Contact::create(['full_name' => 'ف', 'type' => 'lead', 'stage' => 'new', 'owner_id' => $owner->id, 'deal_value_kwd' => 1500]);
        $this->svc()->update($lead, ['stage' => 'won']);

        $tx = LoyaltyTransaction::where('user_id', $owner->id)->where('source', 'referral_contracted')->firstOrFail();
        $this->assertSame(20, $tx->points); // 1500 → متوسط

        $this->actingAsUserWith(['loyalty.manage']);
        $this->postJson("/api/v1/loyalty/transactions/{$tx->id}/approve")->assertOk();

        $this->assertSame(20, app(\App\Services\LoyaltyService::class)->userAvailableBalance($owner));
    }
}
