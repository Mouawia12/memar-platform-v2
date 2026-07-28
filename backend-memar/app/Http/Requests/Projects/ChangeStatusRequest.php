<?php

declare(strict_types=1);

namespace App\Http\Requests\Projects;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * تغيير حالة المشروع مع تسجيل السبب (PROJ-5).
 */
class ChangeStatusRequest extends FormRequest
{
    public const STATUSES = ['draft', 'active', 'review', 'on_hold', 'done', 'cancelled'];

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
            'status' => ['required', Rule::in(self::STATUSES)],
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ];
    }
}
