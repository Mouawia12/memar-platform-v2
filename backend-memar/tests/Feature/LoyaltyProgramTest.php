<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Invoice;
use App\Models\User;
use App\Services\LoyaltyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * برنامج الولاء والإحالة — الكسب/الصرف/المستويات/الإحالة الثنائية وتطبيق الرصيد.
 */
class LoyaltyProgramTest extends TestCase
{
    use RefreshDatabase;

    private function svc(): LoyaltyService
    {
        return app(LoyaltyService::class);
    }

    private function actingAsClient(Contact $contact): User
    {
        $user = User::factory()->create(['contact_id' => $contact->id]);
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_award_updates_balance_lifetime_and_writes_ledger(): void
    {
        $c = Contact::factory()->create();

        $this->svc()->award($c, 300, 'project_completed', null, 'مشروع');
        $this->svc()->award($c, 100, 'signup', null, 'ترحيب');

        $c->refresh();
        $this->assertSame(400, $c->loyalty_points);
        $this->assertSame(400, $c->loyalty_points_lifetime);
        $this->assertSame(2, $c->loyaltyTransactions()->count());
        $this->assertSame(400, $c->loyaltyTransactions()->latest('id')->first()->balance_after);
    }

    public function test_redeem_creates_voucher_reduces_balance_keeps_lifetime(): void
    {
        $c = Contact::factory()->create();
        $this->svc()->award($c, 500, 'referral', null, null);
        $this->actingAsClient($c);

        $this->postJson('/api/v1/client-portal/loyalty/redeem', ['points' => 300])
            ->assertOk()
            ->assertJsonPath('data.points_spent', 300)
            ->assertJsonPath('data.balance', 200);

        $c->refresh();
        $this->assertSame(200, $c->loyalty_points);
        $this->assertSame(500, $c->loyalty_points_lifetime); // الصرف لا يخفض «مدى الحياة»
        $this->assertSame(1, $c->loyaltyRedemptions()->where('status', 'available')->count());
        $this->assertEqualsWithDelta(3.0, $this->svc()->availableCredit($c), 0.001);
    }

    public function test_redeem_rejects_insufficient_balance(): void
    {
        $c = Contact::factory()->create();
        $this->svc()->award($c, 100, 'signup', null, null);
        $this->actingAsClient($c);

        $this->postJson('/api/v1/client-portal/loyalty/redeem', ['points' => 500])->assertStatus(422);
    }

    public function test_referral_awards_referrer_on_join_then_contract(): void
    {
        $referrer = Contact::factory()->create();
        $friend = Contact::factory()->create();
        $svc = $this->svc();
        $svc->ensureReferralCode($referrer);

        $ref = $svc->registerReferral($friend, $referrer);
        $this->assertNotNull($ref);
        $this->assertSame('joined', $ref->status);
        $this->assertSame($referrer->id, $friend->fresh()->referred_by_contact_id);
        $this->assertSame((int) config('loyalty.earn.referral_joined'), $referrer->fresh()->loyalty_points);

        $svc->markReferredContracted($friend);
        $this->assertSame('contracted', $ref->fresh()->status);

        $expected = (int) config('loyalty.earn.referral_joined') + (int) config('loyalty.earn.referral_contracted');
        $this->assertSame($expected, $referrer->fresh()->loyalty_points);
    }

    public function test_referral_ignores_self_referral(): void
    {
        $c = Contact::factory()->create();
        $this->svc()->ensureReferralCode($c);
        $this->assertNull($this->svc()->registerReferral($c, $c));
    }

    public function test_tier_progresses_with_lifetime_points(): void
    {
        $c = Contact::factory()->create();
        $this->assertSame('bronze', $this->svc()->tier($c)['key']);

        $this->svc()->award($c, 1200, 'adjust', null, null);
        $tier = $this->svc()->tier($c->fresh());
        $this->assertSame('silver', $tier['key']);
        $this->assertSame('ذهبي', $tier['next']['label']);
        $this->assertSame(1800, $tier['next']['remaining']); // 3000 - 1200
    }

    public function test_apply_voucher_to_invoice_reduces_due(): void
    {
        $c = Contact::factory()->create();
        $this->svc()->award($c, 500, 'referral', null, null);
        $voucher = $this->svc()->redeem($c, 300); // 3 د.ك
        $invoice = Invoice::create([
            'number' => 'INV-TEST', 'client_id' => $c->id,
            'subtotal_kwd' => 10, 'total_kwd' => 10, 'paid_kwd' => 0, 'status' => 'sent',
        ]);
        $this->actingAsClient($c);

        $res = $this->postJson('/api/v1/client-portal/loyalty/apply-credit', [
            'voucher_code' => $voucher->code, 'invoice_id' => $invoice->id,
        ])->assertOk();
        $this->assertEqualsWithDelta(3.0, (float) $res->json('data.applied_kwd'), 0.001);

        $invoice->refresh();
        $this->assertSame('partial', $invoice->status);
        $this->assertEqualsWithDelta(3.0, (float) $invoice->paid_kwd, 0.001);
        $this->assertSame('applied', $voucher->fresh()->status);
    }

    public function test_loyalty_endpoint_returns_full_shape(): void
    {
        $c = Contact::factory()->create();
        $this->svc()->award($c, 1200, 'project_completed', null, 'مشروع');
        $this->actingAsClient($c);

        $this->getJson('/api/v1/client-portal/loyalty')
            ->assertOk()
            ->assertJsonPath('data.points', 1200)
            ->assertJsonPath('data.tier.key', 'silver')
            ->assertJsonStructure(['data' => ['code', 'points', 'tier' => ['key', 'label', 'next', 'progress'], 'ledger', 'referrals', 'vouchers', 'redeem', 'unpaid_invoices']]);
    }
}
