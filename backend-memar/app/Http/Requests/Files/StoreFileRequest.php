<?php

declare(strict_types=1);

namespace App\Http\Requests\Files;

use App\Services\FileStorageService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreFileRequest extends FormRequest
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
            'file' => ['required', 'file', 'max:20480'], // 20 ميغابايت
            'name' => ['nullable', 'string', 'max:255'],
            'folder' => ['nullable', 'string', 'max:120'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'contact_id' => ['nullable', 'integer', 'exists:contacts,id'],
            'notes' => ['nullable', 'string'],
        ];
    }

    /** منع الامتدادات التنفيذية الخطرة. */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $file = $this->file('file');
            if (! $file) {
                return;
            }
            $ext = strtolower($file->getClientOriginalExtension());
            if (in_array($ext, FileStorageService::BLOCKED_EXTENSIONS, true)) {
                $v->errors()->add('file', 'نوع الملف غير مسموح به لأسباب أمنية.');
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.max' => 'أقصى حجم للملف 20 ميغابايت.',
        ];
    }
}
