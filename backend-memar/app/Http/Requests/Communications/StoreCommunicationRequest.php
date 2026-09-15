<?php

declare(strict_types=1);

namespace App\Http\Requests\Communications;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCommunicationRequest extends FormRequest
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
            'contact_name' => ['required_without_all:contact_id,company_id,user_id', 'nullable', 'string', 'max:255'],
            'contact_type' => ['nullable', Rule::in(['client', 'company', 'staff'])],
            'contact_id' => ['nullable', 'integer', 'exists:contacts,id'],
            'company_id' => ['nullable', 'integer', 'exists:companies,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'phone' => ['nullable', 'string', 'max:30'],
            'channel' => ['required', Rule::in(['whatsapp', 'phone', 'email', 'sms', 'meeting'])],
            'direction' => ['required', Rule::in(['inbound', 'outbound'])],
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
            'happened_at' => ['nullable', 'date'],
            'follow_up_at' => ['nullable', 'date'],
        ];
    }
}
