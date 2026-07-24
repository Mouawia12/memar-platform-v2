<?php

declare(strict_types=1);

namespace App\Http\Requests\FieldVisits;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFieldVisitRequest extends FormRequest
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
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'engineer_id' => ['nullable', 'integer', 'exists:users,id'],
            'type' => ['sometimes', 'required', Rule::in(['inspection', 'progress', 'handover', 'survey', 'other'])],
            'status' => ['sometimes', 'required', Rule::in(['scheduled', 'completed', 'cancelled'])],
            'visit_date' => ['sometimes', 'required', 'date'],
            'location' => ['nullable', 'string', 'max:255'],
            'progress_pct' => ['nullable', 'integer', 'min:0', 'max:100'],
            'findings' => ['nullable', 'string'],
            'recommendations' => ['nullable', 'string'],
        ];
    }
}
