<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Quotation;
use Illuminate\Support\Facades\DB;

/**
 * تدفّق المبيعات: عرض سعر → عقد → جدول دفعات (فواتير).
 * جدول الدفعات 40/30/30 بنفس مسمّيات المراحل في نظام معمار.
 */
class SalesWorkflowService
{
    /** جدول الدفعات القياسي — النسبة ووصف المرحلة وفارق الاستحقاق بالأيام. */
    public const PAYMENT_SCHEDULE = [
        ['pct' => 0.40, 'label' => 'الدفعة الأولى عند التوقيع', 'due_days' => 0],
        ['pct' => 0.30, 'label' => 'الدفعة الثانية عند رخصة الإطفاء', 'due_days' => 30],
        ['pct' => 0.30, 'label' => 'الدفعة الثالثة عند رخصة البناء', 'due_days' => 60],
    ];

    /**
     * تحويل عرض سعر مقبول إلى عقد.
     *
     * @throws \RuntimeException إن كان العرض محوّلًا مسبقًا
     */
    public function quotationToContract(Quotation $quotation, ?int $userId): Contract
    {
        $existing = Contract::where('quotation_id', $quotation->id)->first();
        if ($existing) {
            throw new \RuntimeException('هذا العرض محوّل إلى عقد بالفعل: '.($existing->number ?? "#{$existing->id}"));
        }

        return DB::transaction(function () use ($quotation, $userId): Contract {
            $contract = Contract::create([
                'number' => $this->nextNumber(Contract::class, 'CON'),
                'quotation_id' => $quotation->id,
                'client_id' => $quotation->client_id,
                'project_id' => $quotation->project_id,
                'value_kwd' => $quotation->total_kwd,
                'status' => 'draft',
                'start_date' => now()->toDateString(),
                'notes' => 'محوّل من عرض السعر '.($quotation->number ?? "#{$quotation->id}"),
                'created_by' => $userId,
            ]);

            $quotation->update(['status' => 'accepted']);

            return $contract->load(['client:id,full_name', 'project:id,name']);
        });
    }

    /**
     * توليد فواتير جدول الدفعات لعقد.
     *
     * @return array<int, Invoice>
     *
     * @throws \RuntimeException إن كانت الفواتير مولّدة مسبقًا
     */
    public function contractToInvoices(Contract $contract): array
    {
        if (Invoice::where('contract_id', $contract->id)->exists()) {
            throw new \RuntimeException('جدول الدفعات مولّد لهذا العقد بالفعل.');
        }

        $value = (float) $contract->value_kwd;
        if ($value <= 0) {
            throw new \RuntimeException('قيمة العقد يجب أن تكون أكبر من صفر.');
        }

        return DB::transaction(function () use ($contract, $value): array {
            $invoices = [];

            foreach (self::PAYMENT_SCHEDULE as $index => $step) {
                // الدفعة الأخيرة تأخذ الفارق لتفادي خطأ التقريب
                $amount = $index === count(self::PAYMENT_SCHEDULE) - 1
                    ? round($value - array_sum(array_column($invoices, 'total_kwd')), 3)
                    : round($value * $step['pct'], 3);

                $invoice = Invoice::create([
                    'number' => $this->nextNumber(Invoice::class, 'INV'),
                    'contract_id' => $contract->id,
                    'client_id' => $contract->client_id,
                    'project_id' => $contract->project_id,
                    'subtotal_kwd' => $amount,
                    'tax_kwd' => 0,
                    'total_kwd' => $amount,
                    'paid_kwd' => 0,
                    'status' => 'draft',
                    'issue_date' => now()->toDateString(),
                    'due_date' => now()->addDays($step['due_days'])->toDateString(),
                    'notes' => $step['label'].' ('.(int) ($step['pct'] * 100).'%)',
                ]);

                $invoices[] = $invoice;
            }

            return $invoices;
        });
    }

    /** رقم تسلسلي بصيغة PREFIX-YYYY-NNN. */
    private function nextNumber(string $model, string $prefix): string
    {
        $year = now()->year;
        $count = $model::withTrashed()->whereYear('created_at', $year)->count() + 1;

        return sprintf('%s-%d-%03d', $prefix, $year, $count);
    }
}
