<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\LoyaltyRule;
use App\Models\PipelineStage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OpportunityFieldsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // مرحلة افتراضية غير رابحة (مبذورة في الهجرة) كي لا يتحوّل الاتصال لمشروع أثناء الاختبار.
        PipelineStage::firstOrCreate(['key' => 'new'], ['label' => 'جديد', 'color' => '#888', 'position' => 1, 'is_won' => false, 'is_lost' => false, 'is_protected' => true]);
        LoyaltyRule::create(['name' => 'متوسط', 'min_value' => 1000, 'max_value' => 1999.999, 'points' => 20, 'is_active' => true, 'position' => 20]);
        LoyaltyRule::create(['name' => 'كبير', 'min_value' => 2000, 'max_value' => null, 'points' => 50, 'is_active' => true, 'position' => 30]);
    }

    public function test_create_opportunity_computes_expected_points(): void
    {
        $this->actingAsUserWith(['crm.manage']);

        $res = $this->postJson('/api/v1/contacts', [
            'full_name' => 'محمد أحمد', 'type' => 'lead', 'stage' => 'new',
            'price_1_kwd' => 1500, 'price_2_kwd' => 2000, 'price_3_kwd' => 2500,
            'expected_price_kwd' => 2000, 'project_type' => 'villa',
            'priority' => 'urgent', 'is_vip' => true, 'is_urgent' => true,
            'area_sqm' => 800, 'region' => 'السالمية', 'address' => 'قطعة 5',
        ])->assertCreated();

        // 2000 د.ك تقع في قاعدة «كبير» → 50 نقطة متوقّعة (يحسبها النظام)
        $this->assertSame(50, $res->json('data.expected_points'));
        $this->assertSame('urgent', $res->json('data.priority'));
        $this->assertTrue($res->json('data.is_vip'));
        $this->assertTrue($res->json('data.is_urgent'));
        $this->assertSame('السالمية', $res->json('data.region'));
        $this->assertDatabaseHas('contacts', ['full_name' => 'محمد أحمد', 'expected_points' => 50, 'priority' => 'urgent']);
    }

    public function test_expected_points_recomputed_on_price_change(): void
    {
        $this->actingAsUserWith(['crm.manage']);
        $lead = Contact::create(['full_name' => 'س', 'type' => 'lead', 'stage' => 'new', 'expected_price_kwd' => 2500, 'expected_points' => 50]);

        $res = $this->putJson("/api/v1/contacts/{$lead->id}", ['expected_price_kwd' => 1500])->assertOk();

        // 1500 → قاعدة «متوسط» → 20
        $this->assertSame(20, $res->json('data.expected_points'));
    }

    public function test_expected_points_cannot_be_set_by_user(): void
    {
        $this->actingAsUserWith(['crm.manage']);

        $res = $this->postJson('/api/v1/contacts', [
            'full_name' => 'ص', 'type' => 'lead', 'stage' => 'new',
            'expected_price_kwd' => 1500, 'expected_points' => 9999, // محاولة تلاعب
        ])->assertCreated();

        $this->assertSame(20, $res->json('data.expected_points')); // النظام تجاهل 9999
    }

    public function test_opportunity_links_to_existing_customer(): void
    {
        $this->actingAsUserWith(['crm.manage']);
        $customer = Contact::create(['full_name' => 'عميل قديم', 'type' => 'client', 'stage' => 'new', 'internal_rating' => 4]);

        $res = $this->postJson('/api/v1/contacts', [
            'full_name' => 'عميل قديم', 'type' => 'lead', 'stage' => 'new',
            'parent_contact_id' => $customer->id, 'expected_price_kwd' => 1500,
        ])->assertCreated();

        $this->assertSame($customer->id, $res->json('data.parent_contact_id'));
        $this->assertDatabaseHas('contacts', ['id' => $res->json('data.id'), 'parent_contact_id' => $customer->id]);
    }

    public function test_invalid_priority_rejected(): void
    {
        $this->actingAsUserWith(['crm.manage']);

        $this->postJson('/api/v1/contacts', [
            'full_name' => 'x', 'type' => 'lead', 'stage' => 'new', 'priority' => 'super',
        ])->assertStatus(422);
    }

    public function test_admin_sets_and_sees_price_points(): void
    {
        // المدير (loyalty.manage) يحدّد نقاط كل سعر ويراها في الاستجابة.
        $this->actingAsUserWith(['crm.manage', 'loyalty.manage']);
        $lead = Contact::create(['full_name' => 'ع', 'type' => 'lead', 'stage' => 'new', 'price_1_kwd' => 42000, 'price_2_kwd' => 55000]);

        $res = $this->putJson("/api/v1/contacts/{$lead->id}", ['points_1' => 20, 'points_2' => 50])->assertOk();

        $this->assertSame(20, $res->json('data.points_1'));
        $this->assertSame(50, $res->json('data.points_2'));
        $this->assertDatabaseHas('contacts', ['id' => $lead->id, 'points_1' => 20, 'points_2' => 50]);
    }

    public function test_employee_sees_points_but_cannot_set_them(): void
    {
        // الموظف (بلا loyalty.manage): يرى نقاطه في الاستجابة، لكن لا يستطيع تعديلها.
        $this->actingAsUserWith(['crm.manage']);
        $lead = Contact::create(['full_name' => 'ن', 'type' => 'lead', 'stage' => 'new', 'price_1_kwd' => 42000, 'points_1' => 7]);

        $res = $this->putJson("/api/v1/contacts/{$lead->id}", ['points_1' => 999])->assertOk();

        $this->assertDatabaseHas('contacts', ['id' => $lead->id, 'points_1' => 7]); // لم يتغيّر (تُهمَل محاولته)
        $this->assertSame(7, $res->json('data.points_1')); // لكنه يراها
    }
}
