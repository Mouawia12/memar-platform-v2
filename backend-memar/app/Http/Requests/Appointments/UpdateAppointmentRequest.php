<?php

declare(strict_types=1);

namespace App\Http\Requests\Appointments;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAppointmentRequest extends FormRequest
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
            'type' => ['sometimes', 'required', Rule::in(['meeting', 'appointment'])],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'start_at' => ['sometimes', 'required', 'date'],
            'end_at' => ['nullable', 'date', 'after_or_equal:start_at'],
            'location' => ['nullable', 'string', 'max:255'],
            'is_video' => ['boolean'],
            'status' => ['nullable', Rule::in(['scheduled', 'done', 'cancelled'])],
            'notes' => ['nullable', 'string'],
        ];
    }
}
