<?php

declare(strict_types=1);

namespace App\Http\Requests\FieldVisits;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFieldVisitRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'engineer_id' => ['nullable', 'integer', 'exists:users,id'],
            'type' => ['required', Rule::in(['inspection', 'progress', 'handover', 'survey', 'other'])],
            'status' => ['required', Rule::in(['scheduled', 'completed', 'cancelled'])],
            'visit_date' => ['required', 'date'],
            'location' => ['nullable', 'string', 'max:255'],
            'progress_pct' => ['nullable', 'integer', 'min:0', 'max:100'],
            'findings' => ['nullable', 'string'],
            'recommendations' => ['nullable', 'string'],
        ];
    }
}
