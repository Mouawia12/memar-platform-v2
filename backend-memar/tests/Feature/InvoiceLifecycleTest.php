<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Invoice;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * دورة حياة الفاتورة: الإنشاء والترقيم والتحصيل وانتقال الحالة، وحاجز finance.*.
 *
 * الطبقة المالية كانت بلا اختبار واحد رغم أنها أكثر ما يُحاسَب عليه المكتب.
 */
class InvoiceLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private function invoicePayload(array $overrides = []): array
    {
        return array_merge([
            'client_id' => Contact::factory()->create()->id,
            'project_id' => Project::factory()->create()->id,
            'subtotal_kwd' => 1000,
            'tax_kwd' => 50,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
        ], $overrides);
    }

    public function test_creating_an_invoice_computes_total_and_assigns_a_number(): void
    {
        $this->actingAsUserWith(['finance.view', 'finance.manage']);

        $data = $this->postJson('/api/v1/invoices', $this->invoicePayload())
            ->assertCreated()
            ->json('data');

        $this->assertSame('1050.000', $data['total_kwd'], 'الإجمالي = المبلغ + الضريبة');
        $this->assertSame('0.000', $data['paid_kwd']);
        $this->assertMatchesRegularExpression('/^INV-\d{4}$/', $data['number']);
    }

    public function test_partial_payment_moves_the_invoice_to_partial(): void
    {
        $this->actingAsUserWith(['finance.view', 'finance.manage']);
        $id = $this->postJson('/api/v1/invoices', $this->invoicePayload())->json('data.id');

        $data = $this->postJson("/api/v1/invoices/{$id}/payments", [
            'amount_kwd' => 400,
            'method' => 'knet',
        ])->assertOk()->json('data');

        $this->assertSame('partial', $data['status']);
        $this->assertSame('400.000', $data['paid_kwd']);
    }

    public function test_paying_the_full_amount_moves_the_invoice_to_paid(): void
    {
        $this->actingAsUserWith(['finance.view', 'finance.manage']);
        $id = $this->postJson('/api/v1/invoices', $this->invoicePayload())->json('data.id');

        $this->postJson("/api/v1/invoices/{$id}/payments", ['amount_kwd' => 600, 'method' => 'cash'])->assertOk();
        $data = $this->postJson("/api/v1/invoices/{$id}/payments", ['amount_kwd' => 450, 'method' => 'transfer'])
            ->assertOk()->json('data');

        $this->assertSame('paid', $data['status']);
        $this->assertSame('1050.000', $data['paid_kwd']);
        $this->assertCount(2, $data['payments']);
    }

    public function test_a_cancelled_invoice_does_not_flip_back_to_paid(): void
    {
        $this->actingAsUserWith(['finance.view', 'finance.manage']);
        $id = $this->postJson('/api/v1/invoices', $this->invoicePayload(['status' => 'cancelled']))->json('data.id');

        $data = $this->postJson("/api/v1/invoices/{$id}/payments", ['amount_kwd' => 1050, 'method' => 'cash'])
            ->assertOk()->json('data');

        $this->assertSame('cancelled', $data['status']);
    }

    public function test_payment_method_is_validated(): void
    {
        $this->actingAsUserWith(['finance.view', 'finance.manage']);
        $id = $this->postJson('/api/v1/invoices', $this->invoicePayload())->json('data.id');

        $this->postJson("/api/v1/invoices/{$id}/payments", ['amount_kwd' => 10, 'method' => 'bitcoin'])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_updating_subtotal_recomputes_the_total(): void
    {
        $this->actingAsUserWith(['finance.view', 'finance.manage']);
        $id = $this->postJson('/api/v1/invoices', $this->invoicePayload())->json('data.id');

        $data = $this->patchJson("/api/v1/invoices/{$id}", ['subtotal_kwd' => 2000, 'tax_kwd' => 100])
            ->assertOk()->json('data');

        $this->assertSame('2100.000', $data['total_kwd']);
    }

    public function test_finance_view_alone_cannot_create_or_delete(): void
    {
        $this->actingAsUserWith(['finance.view']);
        $invoice = Invoice::create([
            'client_id' => Contact::factory()->create()->id,
            'subtotal_kwd' => 100, 'tax_kwd' => 0, 'total_kwd' => 100, 'paid_kwd' => 0, 'status' => 'draft',
        ]);

        $this->getJson('/api/v1/invoices')->assertOk();
        $this->postJson('/api/v1/invoices', $this->invoicePayload())->assertForbidden();
        $this->deleteJson("/api/v1/invoices/{$invoice->id}")->assertForbidden();
    }

    public function test_a_user_without_finance_permissions_sees_nothing(): void
    {
        $this->actingAsUserWith(['projects.view']);

        $this->getJson('/api/v1/invoices')->assertForbidden();
    }
}
