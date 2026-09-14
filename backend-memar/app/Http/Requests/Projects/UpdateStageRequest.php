<?php

declare(strict_types=1);

namespace App\Http\Requests\Projects;

use App\Models\ProjectStage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStageRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phase' => ['nullable', 'string', Rule::in(array_keys(ProjectStage::PHASES))],
            'expected_days' => ['nullable', 'integer', 'min:0', 'max:3650'],
        ];
    }
}
