<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Salary;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * منطق المصروفات والنظرة المالية العامة (الحسابات).
 */
class FinanceService
{
    public function list(?string $search, ?string $category, int $perPage = 20): LengthAwarePaginator
    {
        return Expense::query()
            ->when($search, fn ($q, string $s) => $q->where('title', 'like', "%{$s}%")->orWhere('vendor', 'like', "%{$s}%"))
            ->when($category, fn ($q, string $c) => $q->where('category', $c))
            ->with('recorder:id,name')
            ->latest('spent_at')
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Expense
    {
        return Expense::create($data)->load('recorder:id,name');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Expense $expense, array $data): Expense
    {
        $expense->update($data);

        return $expense->load('recorder:id,name');
    }

    public function delete(Expense $expense): void
    {
        $expense->delete();
    }

    /**
     * نظرة مالية عامة: الدخل المحصّل مقابل المصروفات وصافي الربح.
     *
     * @return array<string, mixed>
     */
    public function overview(): array
    {
        $income = round((float) Invoice::sum('paid_kwd'), 3);
        $expenses = round((float) Expense::sum('amount_kwd'), 3);
        $payroll = round((float) Salary::where('status', 'paid')->sum('net_kwd'), 3);

        $byCategory = Expense::selectRaw('category, SUM(amount_kwd) as total, COUNT(*) as c')
            ->groupBy('category')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r): array => [
                'category' => $r->category ?: 'غير مصنّف',
                'total' => round((float) $r->total, 3),
                'count' => (int) $r->c,
            ]);

        return [
            'income' => $income,
            'expenses' => $expenses,
            'payroll_paid' => $payroll,
            'net_profit' => round($income - $expenses - $payroll, 3),
            'expenses_by_category' => $byCategory,
        ];
    }
}
