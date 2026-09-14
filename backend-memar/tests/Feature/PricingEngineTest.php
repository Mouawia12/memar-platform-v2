<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Quotation;
use App\Models\Service;
use App\Models\ServicePackage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * محرّك التسعير بأنواعه (طلب أيمن 2026-09-14): الأسعار من سجلّ الخدمات،
 * والمعامِلات تمسّ الجهد التصميميّ لا الرسوم المقطوعة، والتوفير يُحسب على
 * المساحة المرجعية للباقة — وإلّا قُورن سعرُ المتر بسعرٍ مقطوع فكذب الرقم.
 */
class PricingEngineTest extends TestCase
{
    use RefreshDatabase;

    private function services(): array
    {
        return [
            'design' => Service::create(['name' => 'تصميم معماري', 'category' => 'تصميم', 'unit' => 'م²', 'price_kwd' => 10, 'is_active' => true]),
            'permit' => Service::create(['name' => 'رخصة بناء', 'category' => 'تراخيص', 'unit' => 'مقطوع', 'price_kwd' => 400, 'is_active' => true]),
        ];
    }

    public function test_the_calculator_prices_per_square_metre_from_the_catalogue(): void
    {
        $this->actingAsUserWith(['pricing.view']);
        $s = $this->services();

        $data = $this->postJson('/api/v1/pricing/calculate', [
            'building_type' => 'فيلا', 'area_sqm' => 500, 'floors' => 1,
            'design_level' => 'standard', 'service_ids' => [$s['design']->id],
        ])->assertOk()->json('data');

        // ١٠ د.ك/م² × ٥٠٠م² بلا معامِلات (فيلا ×١، طابق واحد ×١، قياسي ×١)
        $this->assertEqualsWithDelta(5000.0, $data['total_kwd'], 0.001);
        $this->assertEqualsWithDelta(500.0, $data['lines'][0]['qty'], 0.001);
    }

    public function test_factors_touch_per_metre_services_only_not_flat_fees(): void
    {
        $this->actingAsUserWith(['pricing.view']);
        $s = $this->services();

        $data = $this->postJson('/api/v1/pricing/calculate', [
            'building_type' => 'مجمع تجاري', // ×1.3
            'area_sqm' => 500, 'floors' => 3, // ×1.16
            'design_level' => 'premium',      // ×1.35
            'service_ids' => [$s['design']->id, $s['permit']->id],
        ])->assertOk()->json('data');

        $lines = collect($data['lines'])->keyBy('name');
        $this->assertEqualsWithDelta(round(5000 * 1.3 * 1.16 * 1.35, 3), $lines['تصميم معماري']['total_kwd'], 0.001);
        // الرخصة رسمٌ مقطوع: لا يرفعه نوعُ المبنى ولا عددُ طوابقه
        $this->assertEqualsWithDelta(400.0, $lines['رخصة بناء']['total_kwd'], 0.001);
    }

    public function test_package_savings_are_measured_at_its_reference_area(): void
    {
        $this->actingAsUserWith(['pricing.view', 'pricing.manage']);
        $s = $this->services();

        $data = $this->postJson('/api/v1/pricing/packages', [
            'name' => 'باقة التصميم', 'price_kwd' => 4000, 'reference_area_sqm' => 500,
            'service_ids' => [$s['design']->id, $s['permit']->id],
        ])->assertCreated()->json('data.0');

        // ١٠×٥٠٠ + ٤٠٠ = ٥٬٤٠٠ مفردةً، والباقة ٤٬٠٠٠ → توفير ١٬٤٠٠
        $this->assertEqualsWithDelta(5400.0, $data['items_total_kwd'], 0.001);
        $this->assertEqualsWithDelta(1400.0, $data['savings_kwd'], 0.001);
    }

    public function test_a_package_dearer_than_its_parts_shows_no_savings(): void
    {
        $this->actingAsUserWith(['pricing.view', 'pricing.manage']);
        $s = $this->services();

        $data = $this->postJson('/api/v1/pricing/packages', [
            'name' => 'باقة غالية', 'price_kwd' => 9000, 'reference_area_sqm' => 500,
            'service_ids' => [$s['design']->id],
        ])->assertCreated()->json('data.0');

        // لا توفير سالب يُعرض على العميل — صفرٌ صريح
        $this->assertEqualsWithDelta(0.0, $data['savings_kwd'], 0.001);
    }

    public function test_cost_based_pricing_adds_the_margin_to_the_cost(): void
    {
        $this->actingAsUserWith(['pricing.view']);

        $data = $this->postJson('/api/v1/pricing/cost-based', [
            'staff' => [['role' => 'مهندس', 'hours' => 10, 'rate_kwd' => 8]],
            'other_costs' => [['label' => 'فحص تربة', 'amount_kwd' => 150]],
            'margin_percent' => 25,
        ])->assertOk()->json('data');

        $this->assertEqualsWithDelta(230.0, $data['cost_kwd'], 0.001);       // ٨٠ + ١٥٠
        $this->assertEqualsWithDelta(57.5, $data['margin_kwd'], 0.001);      // ٢٥٪
        $this->assertEqualsWithDelta(287.5, $data['final_price_kwd'], 0.001);
        $this->assertNull($data['benchmark_kwd']);         // لا عروض مقبولة بعد
    }

    public function test_the_benchmark_comes_from_accepted_quotations_only(): void
    {
        $this->actingAsUserWith(['pricing.view']);
        Quotation::create(['number' => 'Q-1', 'status' => 'accepted', 'subtotal_kwd' => 1000, 'total_kwd' => 1000]);
        Quotation::create(['number' => 'Q-2', 'status' => 'draft', 'subtotal_kwd' => 9000, 'total_kwd' => 9000]);

        $data = $this->postJson('/api/v1/pricing/cost-based', [
            'staff' => [['role' => 'مهندس', 'hours' => 100, 'rate_kwd' => 10]],
            'margin_percent' => 0,
        ])->assertOk()->json('data');

        // المسوّدة لم تُعرض على عميل فلا تدخل المتوسّط
        $this->assertEqualsWithDelta(1000.0, $data['benchmark_kwd'], 0.001);
        $this->assertEqualsWithDelta(0, $data['diff_percent'], 0.001);
    }

    public function test_deleting_a_package_leaves_its_services_untouched(): void
    {
        $this->actingAsUserWith(['pricing.view', 'pricing.manage']);
        $s = $this->services();
        $this->postJson('/api/v1/pricing/packages', [
            'name' => 'باقة', 'price_kwd' => 100, 'service_ids' => [$s['design']->id],
        ])->assertCreated();

        $this->deleteJson('/api/v1/pricing/packages/'.ServicePackage::first()->id)->assertOk();

        $this->assertDatabaseHas('services', ['id' => $s['design']->id, 'name' => 'تصميم معماري']);
        $this->assertSame(0, ServicePackage::count());
    }

    public function test_managing_packages_requires_the_manage_permission(): void
    {
        $this->actingAsUserWith(['pricing.view']);
        $s = $this->services();

        $this->postJson('/api/v1/pricing/packages', [
            'name' => 'باقة', 'price_kwd' => 100, 'service_ids' => [$s['design']->id],
        ])->assertForbidden();
    }
}
