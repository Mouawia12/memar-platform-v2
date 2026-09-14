<?php

declare(strict_types=1);

namespace App\Http\Requests\Contacts;

use App\Models\Contact;
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
            'client_kind' => ['nullable', Rule::in(['individual', 'company'])],
            'status' => ['nullable', 'string', 'max:50'],
            'stage' => ['nullable', 'string', Rule::exists('pipeline_stages', 'key')],
            'temperature' => ['nullable', Rule::in(['hot', 'warm', 'cold', 'normal'])],
            'deal_value_kwd' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'project_name' => ['nullable', 'string', 'max:255'],
            'project_details' => ['nullable', 'string'],
        ] + $this->opportunityRules();
    }

    /**
     * حقول الفرصة (المرحلة 3) — مشتركة بين الإنشاء والتحديث. expected_points لا يُقبل من
     * المستخدم؛ يحسبه النظام من قواعد النقاط منعًا للتلاعب.
     *
     * @return array<string, mixed>
     */
    protected function opportunityRules(): array
    {
        return [
            'price_1_kwd' => ['nullable', 'numeric', 'min:0'],
            'price_2_kwd' => ['nullable', 'numeric', 'min:0'],
            'price_3_kwd' => ['nullable', 'numeric', 'min:0'],
            'expected_price_kwd' => ['nullable', 'numeric', 'min:0'],
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'is_vip' => ['sometimes', 'boolean'],
            'is_urgent' => ['sometimes', 'boolean'],
            'area_sqm' => ['nullable', 'numeric', 'min:0'],
            'region' => ['nullable', 'string', 'max:120'],
            'block_no' => ['nullable', 'string', 'max:20'],
            'plot_no' => ['nullable', 'string', 'max:20'],
            'project_type' => ['nullable', 'string', 'max:60'],
            'source' => ['nullable', Rule::in(Contact::SOURCES)],
            // منشئ الفرصة — يختاره المستخدم في نموذج الفرصة؛ إن غاب فالمستخدم الحالي.
            'owner_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            // تقييم العميل الداخلي (نجوم + تعليق) — كان في التحديث فقط، وصار في الإنشاء أيضًا.
            'internal_rating' => ['nullable', 'integer', 'min:0', 'max:5'],
            'internal_notes' => ['nullable', 'string', 'max:2000'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:40'],
            'address' => ['nullable', 'string', 'max:255'],
            'parent_contact_id' => ['nullable', 'integer', Rule::exists('contacts', 'id')],
        ];
    }
}
