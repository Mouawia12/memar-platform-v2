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
            'status' => $this->status,
            'stage' => $this->stage,
            'temperature' => $this->temperature,
            'deal_value_kwd' => $this->deal_value_kwd,
            'notes' => $this->notes,
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
            'owner' => $this->whenLoaded('owner', fn () => $this->owner ? [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
