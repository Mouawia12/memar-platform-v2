<?php

declare(strict_types=1);

namespace App\Http\Requests\Contacts;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContactRequest extends FormRequest
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
            'full_name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'company' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'type' => ['sometimes', 'required', Rule::in(['lead', 'client', 'contact'])],
            'client_kind' => ['nullable', Rule::in(['individual', 'company'])],
            'status' => ['nullable', 'string', 'max:50'],
            'stage' => ['sometimes', 'required', 'string', Rule::exists('pipeline_stages', 'key')],
            'temperature' => ['nullable', Rule::in(['hot', 'warm', 'cold', 'normal'])],
            'deal_value_kwd' => ['nullable', 'numeric', 'min:0'],
            // تقييم داخلي (خاص بالفريق) — اجتماع 2026-08-05
            'internal_rating' => ['nullable', 'integer', 'min:0', 'max:5'],
            'internal_notes' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string'],
            'project_name' => ['nullable', 'string', 'max:255'],
            'project_details' => ['nullable', 'string'],
            // حقول الفرصة (المرحلة 3) — expected_points يحسبه النظام لا المستخدم.
            'price_1_kwd' => ['nullable', 'numeric', 'min:0'],
            'price_2_kwd' => ['nullable', 'numeric', 'min:0'],
            'price_3_kwd' => ['nullable', 'numeric', 'min:0'],
            'expected_price_kwd' => ['nullable', 'numeric', 'min:0'],
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'is_vip' => ['sometimes', 'boolean'],
            'is_urgent' => ['sometimes', 'boolean'],
            'area_sqm' => ['nullable', 'numeric', 'min:0'],
            'region' => ['nullable', 'string', 'max:120'],
            'project_type' => ['nullable', 'string', 'max:60'],
            'address' => ['nullable', 'string', 'max:255'],
            'parent_contact_id' => ['nullable', 'integer', Rule::exists('contacts', 'id')],
        ];
    }
}
