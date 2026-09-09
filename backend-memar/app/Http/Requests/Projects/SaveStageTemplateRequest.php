<?php

declare(strict_types=1);

namespace App\Http\Requests\Projects;

use App\Models\ProjectStage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** إنشاء قالب مراحل أو تعديله — الاسم ومراحله (طلب أيمن 2026-09-09). */
class SaveStageTemplateRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:120'],
            'hint' => ['nullable', 'string', 'max:255'],
            'stages' => ['required', 'array', 'min:1', 'max:40'],
            'stages.*.name' => ['required', 'string', 'max:120'],
            'stages.*.expected_days' => ['nullable', 'integer', 'min:0', 'max:2000'],
            'stages.*.phase' => ['nullable', 'string', Rule::in(array_keys(ProjectStage::PHASES))],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'label.required' => 'اسم القالب مطلوب',
            'stages.required' => 'القالب بلا مراحل — أضف مرحلةً واحدة على الأقل',
            'stages.min' => 'القالب بلا مراحل — أضف مرحلةً واحدة على الأقل',
            'stages.*.name.required' => 'كل مرحلة تحتاج اسمًا',
        ];
    }
}
