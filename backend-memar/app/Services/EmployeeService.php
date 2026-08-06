<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Employee;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * منطق إدارة الموظفين (HR).
 */
class EmployeeService
{
    public function list(?string $search, ?string $status, int $perPage = 20): LengthAwarePaginator
    {
        return Employee::query()
            ->when($search, function ($q, string $s): void {
                $q->where(function ($sub) use ($s): void {
                    $sub->where('full_name', 'like', "%{$s}%")
                        ->orWhere('job_title', 'like', "%{$s}%")
                        ->orWhere('department', 'like', "%{$s}%");
                });
            })
            ->when($status, fn ($q, string $st) => $q->where('status', $st))
            ->with('user')
            ->latest()
            ->paginate($perPage);
    }

    /**
     * إحصاءات حقيقية محسوبة على كامل الجدول (لا على صفحة واحدة) — لبطاقات المؤشّرات.
     *
     * @return array{total:int, active:int, left:int, departments:int, total_payroll_kwd:float, by_department:array<int, array{department:string, count:int, payroll:float}>}
     */
    public function stats(): array
    {
        $byDept = Employee::query()
            ->where('status', 'active')
            ->whereNotNull('department')
            ->selectRaw('department, COUNT(*) as count, SUM(base_salary_kwd) as payroll')
            ->groupBy('department')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($r) => [
                'department' => (string) $r->department,
                'count' => (int) $r->count,
                'payroll' => (float) $r->payroll,
            ])
            ->all();

        return [
            'total' => Employee::query()->count(),
            'active' => Employee::query()->where('status', 'active')->count(),
            'left' => Employee::query()->where('status', 'left')->count(),
            'departments' => (int) Employee::query()->whereNotNull('department')->distinct()->count('department'),
            'total_payroll_kwd' => (float) Employee::query()->where('status', 'active')->sum('base_salary_kwd'),
            'by_department' => $byDept,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Employee
    {
        return Employee::create($data)->load('user');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Employee $employee, array $data): Employee
    {
        $employee->update($data);

        return $employee->load('user');
    }

    public function delete(Employee $employee): void
    {
        $employee->delete();
    }
}
