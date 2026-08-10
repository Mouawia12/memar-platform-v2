<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Project
 */
class ProjectResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'status' => $this->status,
            'progress' => $this->progress,
            // قيمة المشروع/العقد مالية سرّية — تظهر فقط لمن يملك finance.view (محاسب/مدير/أدمن)،
            // وتُخفى عن المهندسين في سجل المشاريع. القيمة الكاملة في سجل العقود. طلب أيمن 2026-08-09.
            'budget_kwd' => $this->when((bool) $request->user()?->can('finance.view'), fn () => $this->budget_kwd),
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'description' => $this->description,
            'is_vip' => (bool) $this->is_vip,
            // التقييمات والملاحظات الداخلية سرية — للطاقم المخوّل فقط، لا تصل العميل.
            $this->mergeWhen((bool) $request->user()?->can('projects.manage'), fn (): array => [
                'assessment' => [
                    'rating_profitability' => $this->rating_profitability,
                    'rating_ease' => $this->rating_ease,
                    'rating_revisions' => $this->rating_revisions,
                    'client_rating_commitment' => $this->client_rating_commitment,
                    'client_rating_cooperation' => $this->client_rating_cooperation,
                ],
                'internal_notes' => $this->internal_notes,
            ]),
            'client' => $this->whenLoaded('client', fn () => $this->client ? [
                'id' => $this->client->id,
                'name' => $this->client->full_name,
            ] : null),
            'manager' => $this->whenLoaded('manager', fn () => $this->manager ? [
                'id' => $this->manager->id,
                'name' => $this->manager->name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
