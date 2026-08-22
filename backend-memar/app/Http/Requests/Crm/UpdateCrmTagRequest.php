<?php

declare(strict_types=1);

namespace App\Http\Requests\Crm;

use App\Models\CrmTag;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * تعديل اختصار من نافذة «إعدادات النقاط والاختصارات» — الاسم و/أو اللون.
 * الصلاحية على المسار (crm.delete = الإدارة).
 */
class UpdateCrmTagRequest extends FormRequest
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
            'name' => [
                'sometimes', 'required', 'string', 'max:40',
                Rule::unique(CrmTag::class, 'name')->ignore($this->route('crmTag')),
            ],
            // لون hex سداسي فقط (#RRGGBB) — تُرسله لوحة الألوان في المتصفح.
            'color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ];
    }
}
