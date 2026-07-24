<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Spatie\Activitylog\Models\Activity;

/**
 * @mixin Activity
 */
class ActivityResource extends JsonResource
{
    /** تسميات عربية لأنواع الكيانات. */
    public const SUBJECT_LABELS = [
        'Project' => 'مشروع',
        'Task' => 'مهمة',
        'Contact' => 'عميل / جهة اتصال',
        'Company' => 'شركة',
        'Invoice' => 'فاتورة',
        'Contract' => 'عقد',
        'Employee' => 'موظف',
        'Appointment' => 'موعد / اجتماع',
        'Service' => 'خدمة',
        'Quotation' => 'عرض سعر',
        'Salary' => 'راتب',
        'Expense' => 'مصروف',
        'ServiceRequest' => 'طلب وارد',
        'JobOpening' => 'وظيفة',
        'DocumentTemplate' => 'قالب مستند',
        'User' => 'مستخدم',
        'FieldVisit' => 'زيارة ميدانية',
        'StoredFile' => 'ملف',
        'Communication' => 'تواصل',
        'HeroSlide' => 'شريحة إعلانية',
        'JobApplication' => 'طلب توظيف',
    ];

    /** تسميات عربية للأحداث. */
    public const EVENT_LABELS = [
        'created' => 'إنشاء',
        'updated' => 'تعديل',
        'deleted' => 'حذف',
        'restored' => 'استرجاع',
    ];

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $short = class_basename((string) $this->subject_type);
        $props = $this->properties;
        $new = (array) ($props['attributes'] ?? []);
        $old = (array) ($props['old'] ?? []);

        // الحقول التي تغيّرت فعلًا (للتعديلات)
        $changes = [];
        foreach ($new as $field => $value) {
            $before = $old[$field] ?? null;
            if ($this->event === 'updated' && $before === $value) {
                continue;
            }
            $changes[] = [
                'field' => $field,
                'old' => is_scalar($before) || $before === null ? $before : json_encode($before, JSON_UNESCAPED_UNICODE),
                'new' => is_scalar($value) || $value === null ? $value : json_encode($value, JSON_UNESCAPED_UNICODE),
            ];
        }

        return [
            'id' => $this->id,
            'event' => $this->event,
            'event_label' => self::EVENT_LABELS[(string) $this->event] ?? (string) $this->event,
            'subject_type' => $short,
            'subject_label' => self::SUBJECT_LABELS[$short] ?? $short,
            'subject_id' => $this->subject_id,
            'title' => $this->subjectTitle($new, $old),
            'causer' => $this->causer ? [
                'id' => $this->causer->getKey(),
                'name' => $this->causer->name ?? '—',
            ] : null,
            'changes' => $changes,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * عنوان مقروء للسجل من أبرز حقول الكيان.
     *
     * @param  array<string, mixed>  $new
     * @param  array<string, mixed>  $old
     */
    private function subjectTitle(array $new, array $old): ?string
    {
        foreach (['name', 'full_name', 'title', 'number', 'code', 'contact_name'] as $key) {
            $value = $new[$key] ?? $old[$key] ?? null;
            if (is_string($value) && $value !== '') {
                return $value;
            }
        }

        return null;
    }
}
