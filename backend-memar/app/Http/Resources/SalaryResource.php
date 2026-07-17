<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Salary;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Salary
 */
class SalaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'month' => $this->month,
            'base_kwd' => $this->base_kwd,
            'allowances_kwd' => $this->allowances_kwd,
            'deductions_kwd' => $this->deductions_kwd,
            'net_kwd' => $this->net_kwd,
            'status' => $this->status,
            'paid_at' => $this->paid_at?->toDateString(),
            'employee' => $this->whenLoaded('employee', fn () => $this->employee ? [
                'id' => $this->employee->id,
                'name' => $this->employee->full_name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
