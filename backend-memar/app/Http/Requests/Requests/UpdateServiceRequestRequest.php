<?php

declare(strict_types=1);

namespace App\Http\Requests\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceRequestRequest extends FormRequest
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
            'type' => ['sometimes', 'required', Rule::in(['design', 'supervision', 'inquiry', 'maintenance', 'other'])],
            'client_name' => ['nullable', 'string', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'priority' => ['sometimes', 'required', Rule::in(['low', 'normal', 'high', 'urgent'])],
            'status' => ['sometimes', 'required', Rule::in(['open', 'in_progress', 'resolved', 'closed'])],
            'description' => ['nullable', 'string'],
        ];
    }
}
