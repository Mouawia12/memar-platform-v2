<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Quotation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * منطق عروض الأسعار (Quotations) — البنود والإجماليات.
 */
class QuotationService
{
    public function list(?string $search, ?string $status, int $perPage = 15): LengthAwarePaginator
    {
        return Quotation::query()
            ->when($search, fn ($q, string $s) => $q->where('number', 'like', "%{$s}%"))
            ->when($status, fn ($q, string $st) => $q->where('status', $st))
            ->with(['client', 'project'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId): Quotation
    {
        return DB::transaction(function () use ($data, $userId): Quotation {
            $totals = $this->computeTotals($data['items'], (float) ($data['discount_kwd'] ?? 0));

            $quotation = Quotation::create([
                'client_id' => $data['client_id'] ?? null,
                'project_id' => $data['project_id'] ?? null,
                'status' => $data['status'] ?? 'draft',
                'subtotal_kwd' => $totals['subtotal'],
                'discount_kwd' => $totals['discount'],
                'total_kwd' => $totals['total'],
                'valid_until' => $data['valid_until'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => $userId,
            ]);

            $quotation->number = 'QT-'.str_pad((string) $quotation->id, 4, '0', STR_PAD_LEFT);
            $quotation->save();

            $this->syncItems($quotation, $data['items']);

            return $quotation->load(['client', 'project', 'items']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Quotation $quotation, array $data): Quotation
    {
        return DB::transaction(function () use ($quotation, $data): Quotation {
            if (array_key_exists('items', $data)) {
                $quotation->items()->delete();
                $this->syncItems($quotation, $data['items']);
                $totals = $this->computeTotals($data['items'], (float) ($data['discount_kwd'] ?? $quotation->discount_kwd));
                $data['subtotal_kwd'] = $totals['subtotal'];
                $data['total_kwd'] = $totals['total'];
                $data['discount_kwd'] = $totals['discount'];
            }
            unset($data['items']);
            $quotation->update($data);

            return $quotation->load(['client', 'project', 'items']);
        });
    }

    public function delete(Quotation $quotation): void
    {
        $quotation->delete();
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array{subtotal: float, discount: float, total: float}
     */
    private function computeTotals(array $items, float $discount): array
    {
        $subtotal = 0.0;
        foreach ($items as $item) {
            $subtotal += (float) $item['qty'] * (float) $item['unit_price_kwd'];
        }

        return [
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => max(0, $subtotal - $discount),
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    private function syncItems(Quotation $quotation, array $items): void
    {
        foreach ($items as $item) {
            $quotation->items()->create([
                'service_id' => $item['service_id'] ?? null,
                'description' => $item['description'],
                'qty' => $item['qty'],
                'unit_price_kwd' => $item['unit_price_kwd'],
                'total_kwd' => (float) $item['qty'] * (float) $item['unit_price_kwd'],
            ]);
        }
    }
}
