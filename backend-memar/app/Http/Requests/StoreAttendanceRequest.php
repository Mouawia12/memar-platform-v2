<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * تسجيل حضور يدوي من الموارد البشرية (غياب/إجازة/تصحيح).
 */
class StoreAttendanceRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'date' => ['required', 'date', 'before_or_equal:today'],
            'status' => ['required', 'in:present,late,absent,leave'],
            'check_in_at' => ['nullable', 'date'],
            'check_out_at' => ['nullable', 'date', 'after:check_in_at'],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'date.before_or_equal' => 'لا يمكن تسجيل حضور بتاريخ مستقبلي.',
            'check_out_at.after' => 'وقت الانصراف يجب أن يكون بعد وقت الحضور.',
        ];
    }
}
