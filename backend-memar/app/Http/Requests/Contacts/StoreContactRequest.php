<?php

declare(strict_types=1);

namespace App\Http\Requests\Contacts;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContactRequest extends FormRequest
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
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'company' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'type' => ['required', Rule::in(['lead', 'client', 'contact'])],
            'status' => ['nullable', 'string', 'max:50'],
            'stage' => ['nullable', 'string', Rule::exists('pipeline_stages', 'key')],
            'temperature' => ['nullable', Rule::in(['hot', 'warm', 'cold', 'normal'])],
            'deal_value_kwd' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'project_name' => ['nullable', 'string', 'max:255'],
            'project_details' => ['nullable', 'string'],
        ];
    }
}
