<?php

declare(strict_types=1);

namespace App\Http\Requests\Salaries;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSalaryRequest extends FormRequest
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
            'base_kwd' => ['nullable', 'numeric', 'min:0'],
            'allowances_kwd' => ['nullable', 'numeric', 'min:0'],
            'deductions_kwd' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
