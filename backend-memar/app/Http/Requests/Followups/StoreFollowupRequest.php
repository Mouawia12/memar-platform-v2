<?php

declare(strict_types=1);

namespace App\Http\Requests\Followups;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFollowupRequest extends FormRequest
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
            'client_name' => ['required', 'string', 'max:255'],
            'channel' => ['required', 'string', 'max:40'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'due_date' => ['required', 'date'],
            'done' => ['nullable', 'boolean'],
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'notes' => ['nullable', 'string'],
        ];
    }
}
