<?php

declare(strict_types=1);

namespace App\Http\Requests\Communications;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCommunicationRequest extends FormRequest
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
            'contact_name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'channel' => ['sometimes', 'required', Rule::in(['whatsapp', 'phone', 'email', 'sms', 'meeting'])],
            'direction' => ['sometimes', 'required', Rule::in(['inbound', 'outbound'])],
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
            'happened_at' => ['nullable', 'date'],
        ];
    }
}
