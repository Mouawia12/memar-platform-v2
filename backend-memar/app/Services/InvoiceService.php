<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * منطق الفواتير والتحصيل.
 */
class InvoiceService
{
    public function list(?string $search, ?string $status, int $perPage = 15): LengthAwarePaginator
    {
        return Invoice::query()
            ->when($search, fn ($q, string $s) => $q->where('number', 'like', "%{$s}%"))
            ->when($status, fn ($q, string $st) => $q->where('status', $st))
            ->with(['client', 'project'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Invoice
    {
        $subtotal = (float) ($data['subtotal_kwd'] ?? 0);
        $tax = (float) ($data['tax_kwd'] ?? 0);
        $data['tax_kwd'] = $tax;
        $data['total_kwd'] = $subtotal + $tax;
        $data['paid_kwd'] = 0;

        $invoice = Invoice::create($data);
        $invoice->number = 'INV-'.str_pad((string) $invoice->id, 4, '0', STR_PAD_LEFT);
        $invoice->save();

        return $invoice->load(['client', 'project']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Invoice $invoice, array $data): Invoice
    {
        $subtotal = (float) ($data['subtotal_kwd'] ?? $invoice->subtotal_kwd);
        $tax = (float) ($data['tax_kwd'] ?? $invoice->tax_kwd);
        $data['total_kwd'] = $subtotal + $tax;

        $invoice->update($data);

        return $invoice->load(['client', 'project', 'payments']);
    }

    public function delete(Invoice $invoice): void
    {
        $invoice->delete();
    }

    /**
     * تسجيل دفعة على فاتورة + تحديث المدفوع والحالة.
     *
     * @param  array<string, mixed>  $data
     */
    public function recordPayment(Invoice $invoice, array $data, ?int $userId): Invoice
    {
        /** @var Payment $payment */
        $payment = $invoice->payments()->create([
            'amount_kwd' => $data['amount_kwd'],
            'method' => $data['method'],
            'reference' => $data['reference'] ?? null,
            'paid_at' => $data['paid_at'] ?? now()->toDateString(),
            'recorded_by' => $userId,
        ]);

        $invoice->paid_kwd = (float) $invoice->paid_kwd + (float) $payment->amount_kwd;

        if ($invoice->status !== 'cancelled') {
            $total = (float) $invoice->total_kwd;
            $paid = (float) $invoice->paid_kwd;
            if ($total > 0 && $paid >= $total) {
                $invoice->status = 'paid';
            } elseif ($paid > 0) {
                $invoice->status = 'partial';
            }
        }

        $invoice->save();

        return $invoice->load(['client', 'project', 'payments']);
    }
}
