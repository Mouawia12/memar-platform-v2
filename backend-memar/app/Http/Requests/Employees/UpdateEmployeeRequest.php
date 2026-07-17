<?php

declare(strict_types=1);

namespace App\Http\Requests\Employees;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'full_name' => ['sometimes', 'required', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'hire_date' => ['nullable', 'date'],
            'base_salary_kwd' => ['sometimes', 'required', 'numeric', 'min:0'],
            'phone' => ['nullable', 'string', 'max:30'],
            'national_id' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', Rule::in(['active', 'left'])],
            'notes' => ['nullable', 'string'],
        ];
    }
}
