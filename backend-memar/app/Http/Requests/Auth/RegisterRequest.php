<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * تسجيل عميل جديد ذاتيًا من بوابة العميل.
 */
class RegisterRequest extends FormRequest
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
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:30'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
            // اختيارية — تُثري بطاقة العميل في الـCRM
            'account_type' => ['nullable', 'in:client,company'],
            'company' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.unique' => 'هذا البريد مسجّل بالفعل — سجّل الدخول أو استعد كلمة المرور.',
            'password.confirmed' => 'تأكيد كلمة المرور غير مطابق.',
            'phone.required' => 'رقم الهاتف مطلوب للتواصل.',
        ];
    }
}
