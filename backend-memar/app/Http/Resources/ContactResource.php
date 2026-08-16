<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Contact
 */
class ContactResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'company' => $this->company,
            'position' => $this->position,
            'type' => $this->type,
            // نوع العميل: فرد/شركة — إن لم يُحدَّد نشتقّه من وجود اسم شركة.
            'client_kind' => $this->client_kind ?? ($this->company ? 'company' : 'individual'),
            'status' => $this->status,
            'stage' => $this->stage,
            'temperature' => $this->temperature,
            'deal_value_kwd' => $this->deal_value_kwd,
            // حقول الفرصة (المرحلة 3)
            'priority' => $this->priority ?? 'medium',
            'is_vip' => (bool) $this->is_vip,
            'is_urgent' => (bool) $this->is_urgent,
            'price_1_kwd' => $this->price_1_kwd,
            'price_2_kwd' => $this->price_2_kwd,
            'price_3_kwd' => $this->price_3_kwd,
            'expected_price_kwd' => $this->expected_price_kwd,
            'expected_points' => (int) $this->expected_points,
            'area_sqm' => $this->area_sqm,
            'region' => $this->region,
            'project_type' => $this->project_type,
            'address' => $this->address,
            'parent_contact_id' => $this->parent_contact_id,
            'welcome_discount_used' => (bool) $this->welcome_discount_used,
            'welcome_discount_kwd' => $this->welcome_discount_kwd,
            // ملخّص العميل الأصل حين تكون فرصة لعميل موجود (اسم/تقييم لعرضها على الكرت)
            'parent' => $this->whenLoaded('parentContact', fn () => $this->parentContact ? [
                'id' => $this->parentContact->id,
                'full_name' => $this->parentContact->full_name,
                'internal_rating' => $this->parentContact->internal_rating !== null ? (int) $this->parentContact->internal_rating : null,
            ] : null),
            'notes' => $this->notes,
            'internal_rating' => $this->internal_rating !== null ? (int) $this->internal_rating : null,
            'internal_notes' => $this->internal_notes,
            // الاسم المبدئي المُدخل في الفرصة (مسوّدة تُستخدم قبل التحويل فقط)
            'project_name' => $this->project_name,
            'project_details' => $this->project_details,
            'converted_project_id' => $this->converted_project_id,
            // الاسم الموحّد للعرض دائمًا — يتبع سجل المشاريع بعد التحويل (مصدر الحقيقة)
            'effective_project_name' => $this->effective_project_name,
            // المشروع المرتبط (حيّ من سجل المشاريع) — اسمه ورقمه مصدرهما المشروع
            'project' => $this->whenLoaded('convertedProject', fn () => $this->convertedProject ? [
                'id' => $this->convertedProject->id,
                'code' => $this->convertedProject->code,
                'name' => $this->convertedProject->name,
                'status' => $this->convertedProject->status,
            ] : null),
            // أقرب تذكير معلّق + هل حان وقته (لتنبيه الكرت) — اجتماع 2026-08-05
            'reminder' => $this->whenLoaded('reminders', function () {
                $next = $this->reminders->first();

                return $next ? [
                    'id' => $next->id,
                    'remind_at' => $next->remind_at?->toIso8601String(),
                    'note' => $next->note,
                    'due' => $next->remind_at !== null && $next->remind_at->isPast(),
                ] : null;
            }),
            'owner' => $this->whenLoaded('owner', fn () => $this->owner ? [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
