<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Employee;
use App\Models\Salary;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * منطق الرواتب — احتساب الصافي (أساسي + بدلات − خصومات).
 */
class PayrollService
{
    public function list(?string $month, ?int $employeeId, int $perPage = 20): LengthAwarePaginator
    {
        return Salary::query()
            ->when($month, fn ($q, string $m) => $q->where('month', $m))
            ->when($employeeId, fn ($q, int $id) => $q->where('employee_id', $id))
            ->with('employee')
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Salary
    {
        $base = isset($data['base_kwd'])
            ? (float) $data['base_kwd']
            : (float) (Employee::find($data['employee_id'])?->base_salary_kwd ?? 0);
        $allowances = (float) ($data['allowances_kwd'] ?? 0);
        $deductions = (float) ($data['deductions_kwd'] ?? 0);

        $salary = Salary::create([
            'employee_id' => $data['employee_id'],
            'month' => $data['month'],
            'base_kwd' => $base,
            'allowances_kwd' => $allowances,
            'deductions_kwd' => $deductions,
            'net_kwd' => $base + $allowances - $deductions,
            'notes' => $data['notes'] ?? null,
        ]);

        return $salary->load('employee');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Salary $salary, array $data): Salary
    {
        $base = (float) ($data['base_kwd'] ?? $salary->base_kwd);
        $allowances = (float) ($data['allowances_kwd'] ?? $salary->allowances_kwd);
        $deductions = (float) ($data['deductions_kwd'] ?? $salary->deductions_kwd);

        $salary->update([
            ...$data,
            'base_kwd' => $base,
            'allowances_kwd' => $allowances,
            'deductions_kwd' => $deductions,
            'net_kwd' => $base + $allowances - $deductions,
        ]);

        return $salary->load('employee');
    }

    public function markPaid(Salary $salary): Salary
    {
        $salary->update(['status' => 'paid', 'paid_at' => now()->toDateString()]);

        return $salary->load('employee');
    }

    public function delete(Salary $salary): void
    {
        $salary->delete();
    }
}
