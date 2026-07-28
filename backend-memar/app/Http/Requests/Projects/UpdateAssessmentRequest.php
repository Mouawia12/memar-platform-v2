<?php

declare(strict_types=1);

namespace App\Http\Requests\Projects;

use Illuminate\Foundation\Http\FormRequest;

/**
 * تقييم المشروع والعميل + VIP + ملاحظات داخلية (PROJ-4).
 * كل الحقول اختيارية — يُحدَّث ما يُرسَل فقط.
 */
class UpdateAssessmentRequest extends FormRequest
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
        $rating = ['nullable', 'integer', 'between:1,5'];

        return [
            'rating_profitability' => $rating,
            'rating_ease' => $rating,
            'rating_revisions' => $rating,
            'client_rating_commitment' => $rating,
            'client_rating_cooperation' => $rating,
            'is_vip' => ['sometimes', 'boolean'],
            'internal_notes' => ['nullable', 'string', 'max:10000'],
        ];
    }
}
