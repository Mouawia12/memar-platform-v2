<?php

declare(strict_types=1);

namespace App\Http\Requests\Followups;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFollowupRequest extends FormRequest
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
            'contact_id' => ['nullable', 'integer', 'exists:contacts,id'],
            'client_name' => ['sometimes', 'required', 'string', 'max:255'],
            'channel' => ['sometimes', 'required', 'string', 'max:40'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'due_date' => ['sometimes', 'required', 'date'],
            'done' => ['nullable', 'boolean'],
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'notes' => ['nullable', 'string'],
        ];
    }
}
