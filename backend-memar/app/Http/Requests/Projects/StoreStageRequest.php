<?php

declare(strict_types=1);

namespace App\Http\Requests\Projects;

use Illuminate\Foundation\Http\FormRequest;

class StoreStageRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'expected_days' => ['nullable', 'integer', 'min:0', 'max:3650'],
            // معرّف المرحلة التي تُدرَج بعدها المرحلة الجديدة (اختياري) — يُتحقّق من انتمائها للمشروع في الخدمة.
            'after_stage_id' => ['nullable', 'integer', 'exists:project_stages,id'],
        ];
    }
}
