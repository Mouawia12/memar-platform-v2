<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\LeadReminder;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * بطاقة متابعة في لوحة المتابعة — بنفس شارات بطاقة المهمة (توجيهات، تعليقات،
 * غير المقروء) لأن نشاطهما واحد (طلب أيمن 2026-08-29).
 *
 * @mixin LeadReminder
 */
class FollowUpResource extends JsonResource
{
    /** عدد الدورات الفائتة للمتابعة المتكرّرة — يُحقن من الكونترولر (حسابه هناك). */
    public int $lateCycles = 0;

    /** موعد الدورة الحالية للمتكرّرة (LeadReminder::currentOccurrence) — يُحقن من الكونترولر. */
    public ?CarbonInterface $occurrenceAt = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $me = $request->user()?->id;

        return [
            'id' => $this->id,
            'contact_id' => $this->contact_id,
            'contact' => $this->contact?->full_name,
            'note' => $this->note,
            'description' => $this->description,
            // المتكرّرة بموعد دورتها الحالية: عمودها وتاريخها يتقدّمان مع دوريتها.
            'remind_at' => ($this->occurrenceAt ?? $this->remind_at)?->toIso8601String(),
            'repeat_every' => $this->repeat_every,
            'late_cycles' => $this->lateCycles,
            'done' => (bool) $this->done,
            // المشروع المرتبط بالمتابعة (اختياري)
            'project' => $this->project
                ? ['id' => $this->project->id, 'code' => $this->project->code, 'name' => $this->project->name]
                : null,
            // المكلَّف بالمتابعة، وإن لم يُحدَّد فمسؤول العميل — تُعرض صورته على
            // البطاقة وهو معيار «متابعاتي فقط».
            'assignee' => $this->assignee ? ['id' => $this->assignee->id, 'name' => $this->assignee->name] : null,
            'owner' => $this->assignee
                ? ['id' => $this->assignee->id, 'name' => $this->assignee->name]
                : ($this->contact?->owner
                    ? ['id' => $this->contact->owner->id, 'name' => $this->contact->owner->name]
                    : null),
            // منشئ المتابعة هو صاحب بطاقتها («متابعاتي» ومَن يُنتظر ردّه)
            'creator' => $this->creator ? ['id' => $this->creator->id, 'name' => $this->creator->name] : null,

            // ── نشاط البطاقة (طبق الأصل من بطاقة المهمة) ──
            'comments_count' => (int) ($this->comments_count ?? 0),
            'unread_comments' => (int) ($this->unread_comments_count ?? 0),
            'last_comment' => $this->whenLoaded('latestComment', fn () => $this->latestComment ? [
                'id' => $this->latestComment->id,
                'body' => $this->latestComment->body,
                'user' => $this->latestComment->user
                    ? ['id' => $this->latestComment->user->id, 'name' => $this->latestComment->user->name]
                    : null,
                'created_at' => $this->latestComment->created_at?->toIso8601String(),
            ] : null),
            // آخر خيط: رأسه وآخر رسالة فيه — هو ما تعرضه البطاقة
            'directive' => $this->whenLoaded('directives', function () {
                $latest = $this->directives->first();
                if ($latest === null) {
                    return null;
                }
                $res = new DirectiveResource($latest);
                $res->ownerId = $this->activityOwnerId();

                return $res->toArray(request());
            }),
            // مجموع رسائل الخيوط (الرؤوس + الردود) — الرقم على الشارة
            'directive_messages_count' => $this->whenLoaded(
                'directives',
                fn (): int => $this->directives->count() + $this->directives->sum(fn ($d): int => $d->messages->count()),
            ),
            // رسائل لم أرَها أنا — النقطة الحمراء ووميض البطاقة
            'directive_unread' => $this->whenLoaded(
                'directives',
                fn (): int => (int) $this->directives->sum(fn ($d): int => $d->unseenCountFor($me)),
            ),
            // أنا صاحب البطاقة وآخر رسالة في الخيط ليست منّي → الدور دوري
            'directive_awaits_me' => $this->whenLoaded('directives', fn (): bool => $this->awaitsMe($me)),
        ];
    }

    /**
     * هل الدور دوري في آخر خيط؟ (أنا صاحب البطاقة وآخر رسالة من غيري)
     */
    private function awaitsMe(?int $me): bool
    {
        $latest = $this->directives->first();
        if ($latest === null || $me === null || $this->activityOwnerId() !== $me) {
            return false;
        }

        $last = $latest->lastMessage();

        return $last !== null ? $last->user_id !== $me : $latest->sender_id !== $me;
    }
}
