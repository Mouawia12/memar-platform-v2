<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Quotation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * سلسلة البيع: عرض سعر ← عقد ← جدول دفعات (فواتير).
 *
 * الوحدات الثلاث (quotations / contracts / invoices) كانت بلا اختبار، رغم أنها
 * الطريق الذي تمرّ منه كل ريالات المكتب.
 */
class SalesPipelineTest extends TestCase
{
    use RefreshDatabase;

    /** @param array<int, array<string, mixed>> $items */
    private function quotationPayload(array $items, float $discount = 0): array
    {
        return [
            'client_id' => Contact::factory()->create()->id,
            'items' => $items,
            'discount_kwd' => $discount,
            'valid_until' => now()->addDays(30)->toDateString(),
        ];
    }

    public function test_a_quotation_totals_its_items_and_gets_a_number(): void
    {
        $this->actingAsUserWith(['pricing.view', 'pricing.manage']);

        $data = $this->postJson('/api/v1/quotations', $this->quotationPayload([
            ['description' => 'تصميم معماري', 'qty' => 2, 'unit_price_kwd' => 500],
            ['description' => 'إشراف', 'qty' => 1, 'unit_price_kwd' => 300],
        ]))->assertCreated()->json('data');

        $this->assertEqualsWithDelta(1300, $data['subtotal_kwd'], 0.001);
        $this->assertEqualsWithDelta(1300, $data['total_kwd'], 0.001);
        $this->assertMatchesRegularExpression('/^QT-\d{4}$/', $data['number']);
        $this->assertCount(2, $data['items']);
    }

    public function test_a_discount_comes_off_the_total_but_never_below_zero(): void
    {
        $this->actingAsUserWith(['pricing.view', 'pricing.manage']);

        $data = $this->postJson('/api/v1/quotations', $this->quotationPayload(
            [['description' => 'تصميم', 'qty' => 1, 'unit_price_kwd' => 400]],
            1000, // خصم أكبر من قيمة العرض
        ))->assertCreated()->json('data');

        $this->assertEqualsWithDelta(0, $data['total_kwd'], 0.001, 'الخصم الزائد أنتج إجماليًّا سالبًا');
    }

    public function test_converting_a_quotation_creates_a_contract_and_accepts_the_quotation(): void
    {
        $this->actingAsUserWith(['pricing.view', 'pricing.manage', 'contracts.view', 'contracts.manage']);

        $quotationId = $this->postJson('/api/v1/quotations', $this->quotationPayload([
            ['description' => 'تصميم', 'qty' => 1, 'unit_price_kwd' => 2000],
        ]))->json('data.id');

        $contract = $this->postJson("/api/v1/quotations/{$quotationId}/convert-to-contract")
            ->assertCreated()->json('data');

        $stored = Contract::find($contract['id']);
        $this->assertEqualsWithDelta(2000, (float) $stored->value_kwd, 0.001);
        $this->assertSame('accepted', Quotation::find($quotationId)->status);
        $this->assertSame($quotationId, $stored->quotation_id);
    }

    public function test_a_quotation_cannot_be_converted_twice(): void
    {
        $this->actingAsUserWith(['pricing.view', 'pricing.manage', 'contracts.view', 'contracts.manage']);

        $quotationId = $this->postJson('/api/v1/quotations', $this->quotationPayload([
            ['description' => 'تصميم', 'qty' => 1, 'unit_price_kwd' => 900],
        ]))->json('data.id');

        $this->postJson("/api/v1/quotations/{$quotationId}/convert-to-contract")->assertCreated();
        $this->postJson("/api/v1/quotations/{$quotationId}/convert-to-contract")->assertStatus(422);

        $this->assertSame(1, Contract::where('quotation_id', $quotationId)->count());
    }

    public function test_a_contract_generates_a_payment_schedule_that_sums_to_its_value(): void
    {
        $this->actingAsUserWith(['contracts.view', 'contracts.manage', 'finance.view', 'finance.manage']);

        $contractId = $this->postJson('/api/v1/contracts', [
            'client_id' => Contact::factory()->create()->id,
            'value_kwd' => 10_000,
            'status' => 'active',
        ])->assertCreated()->json('data.id');

        $invoices = $this->postJson("/api/v1/contracts/{$contractId}/generate-invoices")
            ->assertCreated()->json('data');

        $this->assertNotEmpty($invoices);
        $sum = array_sum(array_map(fn (array $i): float => (float) $i['total_kwd'], $invoices));
        $this->assertEqualsWithDelta(10_000, $sum, 0.001, 'مجموع الدفعات لا يساوي قيمة العقد');
    }

    public function test_a_payment_schedule_is_not_generated_twice(): void
    {
        $this->actingAsUserWith(['contracts.view', 'contracts.manage', 'finance.view', 'finance.manage']);

        $contractId = $this->postJson('/api/v1/contracts', [
            'client_id' => Contact::factory()->create()->id,
            'value_kwd' => 5_000,
            'status' => 'active',
        ])->json('data.id');

        $this->postJson("/api/v1/contracts/{$contractId}/generate-invoices")->assertCreated();
        $count = Invoice::where('contract_id', $contractId)->count();

        $this->postJson("/api/v1/contracts/{$contractId}/generate-invoices")->assertStatus(422);

        $this->assertSame($count, Invoice::where('contract_id', $contractId)->count());
    }

    public function test_a_zero_value_contract_cannot_produce_invoices(): void
    {
        $this->actingAsUserWith(['contracts.view', 'contracts.manage', 'finance.view', 'finance.manage']);

        $contractId = $this->postJson('/api/v1/contracts', [
            'client_id' => Contact::factory()->create()->id,
            'value_kwd' => 0,
            'status' => 'draft',
        ])->json('data.id');

        $this->postJson("/api/v1/contracts/{$contractId}/generate-invoices")->assertStatus(422);
        $this->assertSame(0, Invoice::where('contract_id', $contractId)->count());
    }

    public function test_contract_value_is_hidden_from_users_without_finance_view(): void
    {
        $this->actingAsUserWith(['contracts.view', 'contracts.manage']);

        $id = $this->postJson('/api/v1/contracts', [
            'client_id' => Contact::factory()->create()->id,
            'value_kwd' => 7_500,
            'status' => 'active',
        ])->assertCreated()->json('data.id');

        // قيمة العقد سرّية: تُخفى عن المهندس وتظهر للمحاسب (طلب أيمن 2026-08-09).
        $this->getJson("/api/v1/contracts/{$id}")->assertOk()->assertJsonMissingPath('data.value_kwd');

        $this->actingAsUserWith(['contracts.view', 'finance.view']);
        $this->getJson("/api/v1/contracts/{$id}")->assertOk()->assertJsonPath('data.value_kwd', '7500.000');
    }

    public function test_pricing_and_contract_permissions_are_separate_gates(): void
    {
        $this->actingAsUserWith(['pricing.view', 'pricing.manage']);

        $quotationId = $this->postJson('/api/v1/quotations', $this->quotationPayload([
            ['description' => 'تصميم', 'qty' => 1, 'unit_price_kwd' => 100],
        ]))->json('data.id');

        // تسعير بلا عقود: لا يحوّل العرض إلى عقد
        $this->postJson("/api/v1/quotations/{$quotationId}/convert-to-contract")->assertForbidden();
        $this->getJson('/api/v1/contracts')->assertForbidden();
    }
}
