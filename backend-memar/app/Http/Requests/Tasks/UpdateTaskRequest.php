<?php

declare(strict_types=1);

namespace App\Http\Requests\Tasks;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
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
            'description' => ['nullable', 'string'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['sometimes', 'required', Rule::in(['todo', 'in_progress', 'review', 'done', 'cancelled'])],
            'priority' => ['sometimes', 'required', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
            'department' => ['nullable', 'string', 'max:60'],
            'due_date' => ['nullable', 'date'],
            'rating' => ['nullable', Rule::in(['positive', 'negative'])],
        ];
    }
}
