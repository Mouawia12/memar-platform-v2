<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Employee
 */
class EmployeeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'job_title' => $this->job_title,
            'department' => $this->department,
            'hire_date' => $this->hire_date?->toDateString(),
            'base_salary_kwd' => $this->base_salary_kwd,
            'phone' => $this->phone,
            'national_id' => $this->national_id,
            'status' => $this->status,
            'notes' => $this->notes,
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
