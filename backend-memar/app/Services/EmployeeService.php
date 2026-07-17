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
