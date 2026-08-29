<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\LeadReminder;
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
            'remind_at' => $this->remind_at?->toIso8601String(),
            'repeat_every' => $this->repeat_every,
            'late_cycles' => $this->lateCycles,
            'done' => (bool) $this->done,
            // مسؤول العميل — تُعرض صورته على البطاقة
            'owner' => $this->contact?->owner
                ? ['id' => $this->contact->owner->id, 'name' => $this->contact->owner->name]
                : null,
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
            'directive' => $this->whenLoaded(
                'latestDirective',
                fn () => $this->latestDirective ? new DirectiveResource($this->latestDirective) : null,
            ),
            'directives_count' => (int) ($this->directives_count ?? 0),
            'directives_replied_unseen' => (int) ($this->replied_unseen_count ?? 0),
            'directive_awaits_me' => $this->awaitsMe($me),
            'directive_is_new' => $this->awaitsMe($me) && $this->latestDirective?->seen_at === null,
        ];
    }

    /** هل آخر توجيه بلا ردّ وأنا صاحب المتابعة؟ */
    private function awaitsMe(?int $me): bool
    {
        if (! $this->relationLoaded('latestDirective') || $this->latestDirective === null) {
            return false;
        }

        return $this->latestDirective->replied_at === null
            && $this->created_by !== null
            && $this->created_by === $me;
    }
}
