<?php

declare(strict_types=1);

namespace App\Http\Requests\Companies;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanyRequest extends FormRequest
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
            'type' => ['sometimes', 'required', Rule::in(['client', 'supplier', 'gov', 'partner'])],
            'industry' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            // تقييم داخلي (خاص بالفريق) — اجتماع 2026-08-05
            'internal_rating' => ['nullable', 'integer', 'min:0', 'max:5'],
            'internal_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
