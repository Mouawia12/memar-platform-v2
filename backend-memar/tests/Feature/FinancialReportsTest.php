<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Contact;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * تقارير المكتب المالية والتحليلات.
 *
 * هذه المسارات كانت غير قابلة للاختبار أصلًا: AnalyticsService كان يستعمل DATE_FORMAT
 * و SUM(status IN (…)) — صيغة MySQL وحدها — بينما السويت تعمل على SQLite. بعد توحيد
 * التعبير حسب محرّك القاعدة صارت تُختبر هنا فعليًّا.
 */
class FinancialReportsTest extends TestCase
{
    use RefreshDatabase;

    private function invoice(string $issuedAt, float $total, string $status = 'sent'): Invoice
    {
        return Invoice::create([
            'client_id' => Contact::factory()->create()->id,
            'subtotal_kwd' => $total,
            'tax_kwd' => 0,
            'total_kwd' => $total,
            'paid_kwd' => 0,
            'status' => $status,
            'issue_date' => $issuedAt,
            'due_date' => $issuedAt,
        ]);
    }

    public function test_analytics_returns_a_monthly_series_bucketed_by_month(): void
    {
        $this->actingAsUserWith(['finance.view']);

        $this->invoice(now()->startOfMonth()->toDateString(), 1000);
        $this->invoice(now()->startOfMonth()->toDateString(), 500);
        $this->invoice(now()->subMonth()->startOfMonth()->toDateString(), 300);

        $series = $this->getJson('/api/v1/reports/analytics?period=quarter')->assertOk()->json('data.series');

        $this->assertArrayHasKey('labels', $series);
        $this->assertSameSize($series['labels'], $series['revenue']);

        // آخر خانة = الشهر الحالي، وما قبلها = الشهر الماضي.
        $revenue = array_map('floatval', $series['revenue']);
        $this->assertSame(1500.0, end($revenue), 'لم تُجمَّع فاتورتا الشهر الحالي في خانة واحدة');
        $this->assertSame(300.0, $revenue[count($revenue) - 2], 'فاتورة الشهر الماضي لم تقع في خانتها');
    }

    public function test_draft_and_cancelled_invoices_are_excluded_from_revenue(): void
    {
        $this->actingAsUserWith(['finance.view']);

        $this->invoice(now()->startOfMonth()->toDateString(), 900, 'draft');
        $this->invoice(now()->startOfMonth()->toDateString(), 700, 'cancelled');

        $data = $this->getJson('/api/v1/reports/analytics')->assertOk()->json('data');

        $this->assertSame(0, $data['totals']['revenue'], 'مسودّة أو فاتورة ملغاة دخلت الإيراد');
    }

    public function test_expenses_are_bucketed_alongside_revenue(): void
    {
        $this->actingAsUserWith(['finance.view']);

        Expense::create([
            'title' => 'إيجار المكتب',
            'category' => 'إيجار',
            'amount_kwd' => 250,
            'spent_at' => now()->startOfMonth()->toDateString(),
        ]);

        $series = $this->getJson('/api/v1/reports/analytics')->assertOk()->json('data.series');

        $this->assertSame(250.0, (float) end($series['expenses']));
    }

    public function test_attendance_percentage_counts_present_and_late(): void
    {
        $this->actingAsUserWith(['finance.view']);
        $user = User::factory()->create();

        foreach (['present', 'late', 'absent', 'absent'] as $i => $status) {
            Attendance::create([
                'user_id' => $user->id,
                'date' => now()->startOfMonth()->addDays($i)->toDateString(),
                'status' => $status,
            ]);
        }

        $series = $this->getJson('/api/v1/reports/analytics')->assertOk()->json('data.series');

        $this->assertSame(50, end($series['attendance']), 'حاضر + متأخر من أصل أربعة = 50%');
    }

    public function test_summary_reports_outstanding_and_overdue(): void
    {
        $this->actingAsUserWith(['finance.view']);

        $paid = $this->invoice(now()->toDateString(), 1000);
        $paid->update(['paid_kwd' => 1000, 'status' => 'paid']);
        $this->invoice(now()->subDays(10)->toDateString(), 400); // مستحقّة ومتأخرة

        $data = $this->getJson('/api/v1/reports/summary')->assertOk()->json('data');

        $this->assertSame(2, $data['invoices']['count']);
        $this->assertEqualsWithDelta(1400, $data['invoices']['total'], 0.001);
        $this->assertEqualsWithDelta(400, $data['invoices']['outstanding'], 0.001);
        $this->assertSame(1, $data['invoices']['overdue_count']);
    }

    public function test_an_unknown_period_falls_back_instead_of_erroring(): void
    {
        $this->actingAsUserWith(['finance.view']);

        $this->getJson('/api/v1/reports/analytics?period=../../etc/passwd')->assertOk();
    }

    public function test_reports_require_finance_view(): void
    {
        $this->actingAsUserWith(['projects.view']);

        $this->getJson('/api/v1/reports/summary')->assertForbidden();
        $this->getJson('/api/v1/reports/analytics')->assertForbidden();
    }
}
