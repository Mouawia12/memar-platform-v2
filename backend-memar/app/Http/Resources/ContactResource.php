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
        $me = $request->user()?->id;

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
            // أعمدة سجل العملاء (طلب أيمن 2026-09-09)
            'projects_count' => (int) ($this->projects_count ?? 0),
            // الفرص المنسوبة لهذا العميل — تربط السجل بلوحة «عميل جديد»
            'opportunities_count' => (int) ($this->opportunities_count ?? 0),
            // إجمالي العقود بيانات مالية: لا تصل إلا من يملك clients.finance.view
            'contracts_total_kwd' => $this->when(
                (bool) $request->user()?->can('clients.finance.view'),
                fn () => (string) round((float) ($this->contracts_sum_value_kwd ?? 0), 3),
            ),
            'last_contact_at' => $this->whenLoaded('latestUpdate', fn () => $this->latestUpdate?->created_at?->toDateString()),
            'is_urgent' => (bool) $this->is_urgent,
            'price_1_kwd' => $this->price_1_kwd,
            'price_2_kwd' => $this->price_2_kwd,
            'price_3_kwd' => $this->price_3_kwd,
            'expected_price_kwd' => $this->expected_price_kwd,
            'expected_points' => (int) $this->expected_points,
            // نقاط كل خيار سعر — يراها الجميع (الموظف يعرف نقاطه)، لكن تحديدها للإدارة فقط
            // (loyalty.manage عبر UpdateContactRequest)، وقيمتها بالدينار تُعرض للإدارة في الواجهة فقط.
            'points_1' => (int) $this->points_1,
            'points_2' => (int) $this->points_2,
            'points_3' => (int) $this->points_3,
            'area_sqm' => $this->area_sqm,
            'region' => $this->region,
            // عنوان الموقع الكويتي: قطعة/قسيمة
            'block_no' => $this->block_no,
            'plot_no' => $this->plot_no,
            'project_type' => $this->project_type,
            // مصدر الفرصة (موقع/إحالة/إعلان/معرض/اتصال) — يُفلتر عليه في لوحة CRM
            'source' => $this->source,
            'tags' => $this->tags ?? [],
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
            // آخر تحديث سجّله الموظف (يظهر أسفل كرت الفرصة)
            'last_update' => $this->whenLoaded('latestUpdate', fn () => $this->latestUpdate ? [
                'note' => $this->latestUpdate->note,
                'user' => $this->latestUpdate->user?->name,
                'at' => $this->latestUpdate->created_at?->toDateString(),
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
            // منشئ الفرصة — يُسجَّل تلقائيًا عند الإنشاء (منفصل عن المكلّف)
            'creator' => $this->whenLoaded('createdBy', fn () => $this->createdBy ? [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
            ] : null),
            // مَن نقل الفرصة إلى مرحلتها الحالية (يظهر على الكرت بجانب المكلّف)
            'mover' => $this->whenLoaded('movedBy', fn () => $this->movedBy ? [
                'id' => $this->movedBy->id,
                'name' => $this->movedBy->name,
                'at' => $this->moved_at?->toDateString(),
                'from' => $this->moved_from,
            ] : null),
            'owner' => $this->whenLoaded('owner', fn () => $this->owner ? [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
            // ── توجيه الإدارة على الفرصة (طلب أيمن 2026-09-13) ──
            // منه لون البطاقة في اللوحة: أحمر ينتظر ردًّا، أخضر رُدَّ عليه، بلا توجيه أبيض.
            'directive' => $this->whenLoaded('directives', function () {
                $latest = $this->directives->first();
                if ($latest === null) {
                    return null;
                }
                $res = new DirectiveResource($latest);
                $res->ownerId = $this->activityOwnerId();

                return $res->toArray(request());
            }),
            'directive_messages_count' => $this->whenLoaded(
                'directives',
                fn (): int => $this->directives->count() + $this->directives->sum(fn ($d): int => $d->messages->count()),
            ),
            // رسائل لم يرَها المستخدم الحالي — الرقم على الشارة
            'directive_unread' => $this->whenLoaded(
                'directives',
                fn (): int => (int) $this->directives->sum(fn ($d): int => $d->unseenCountFor($me)),
            ),
            /*
             * حالة الخيط كما تراها الإدارة والموظف معًا:
             * awaiting = الإدارة سألت ولم يردّ صاحب الفرصة بعد (أحمر)
             * replied  = صاحب الفرصة ردّ آخرًا (أخضر) · null = لا توجيه (أبيض)
             */
            'directive_state' => $this->whenLoaded('directives', fn (): ?string => $this->directiveState()),
            // ساعات ما بين كل توجيه وأول ردّ لصاحب الفرصة — منها «متوسط زمن الرد»
            'response_hours' => $this->whenLoaded('directives', fn (): array => $this->responseHours()),
            'archived_at' => $this->archived_at?->toIso8601String(),
        ];
    }

    /**
     * زمن الرد على كل توجيه: من إرساله إلى أول رسالة من صاحب الفرصة بعده.
     * التوجيهات التي لم يُردّ عليها لا تدخل المتوسط.
     *
     * @return list<float>
     */
    private function responseHours(): array
    {
        $owner = $this->activityOwnerId();
        if ($owner === null) {
            return [];
        }

        return $this->directives
            ->map(function ($d) use ($owner): ?float {
                $reply = $d->messages->first(fn ($m): bool => $m->user_id === $owner && $m->created_at?->gte($d->created_at));

                return $reply ? round($d->created_at->diffInSeconds($reply->created_at) / 3600, 2) : null;
            })
            ->filter(fn (?float $h): bool => $h !== null)
            ->values()
            ->all();
    }

    /** حالة آخر خيط توجيه: أينتظر ردّ صاحب الفرصة أم رُدّ عليه؟ */
    private function directiveState(): ?string
    {
        $latest = $this->directives->first();
        if ($latest === null) {
            return null;
        }

        $owner = $this->activityOwnerId();
        $last = $latest->lastMessage();
        $lastBy = $last !== null ? $last->user_id : $latest->sender_id;

        // آخر كلمة لصاحب الفرصة = ردَّ؛ وإلّا فالكرة في ملعبه
        return $owner !== null && $lastBy === $owner ? 'replied' : 'awaiting';
    }
}
