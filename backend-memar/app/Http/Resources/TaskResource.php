<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Task
 */
class TaskResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $me = $request->user()?->id;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            // نسبة إنجاز المهمة — تظهر كشريط تقدّم على البطاقة
            'progress' => (int) $this->progress,
            // صاحب آخر تعديل للنسبة ووقته — يظهران تحت شريط التقدّم على البطاقة
            'progress_by' => $this->whenLoaded('progressBy', fn () => $this->progressBy ? [
                'id' => $this->progressBy->id,
                'name' => $this->progressBy->name,
            ] : null),
            'progress_at' => $this->progress_at?->toIso8601String(),
            'due_date' => $this->due_date?->toDateString(),
            // بيانات المشروع الموحّدة — الاسم والرقم مصدرهما سجل المشاريع (مصدر الحقيقة)
            'project' => $this->whenLoaded('project', fn () => $this->project ? [
                'id' => $this->project->id,
                'code' => $this->project->code,
                'name' => $this->project->name,
            ] : null),
            'assignee' => $this->whenLoaded('assignee', fn () => $this->assignee ? [
                'id' => $this->assignee->id,
                'name' => $this->assignee->name,
            ] : null),
            // عدّاد التعليقات + آخر تحديث — لإظهار جرس «تحديث جديد» على الكرت (اجتماع 2026-08-05)
            'comments_count' => (int) ($this->comments_count ?? 0),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            // جرس «نشاط جديد» لكل مستخدم على حدة: نشاط خلال آخر 24 ساعة لم يعلّمه المستخدم كمقروء
            'has_unread' => $this->hasUnreadActivity(),
            // تعليقات جديدة لم يقرأها المستخدم الحالي → تنبيه على أيقونة 💬
            'unread_comments' => (int) ($this->unread_comments_count ?? 0),
            // آخر تعليق في محادثة المهمة — نصّه وصاحبه وتاريخه على البطاقة
            'last_comment' => $this->whenLoaded('latestComment', fn () => $this->latestComment ? [
                'id' => $this->latestComment->id,
                'body' => $this->latestComment->body,
                'user' => $this->latestComment->user
                    ? ['id' => $this->latestComment->user->id, 'name' => $this->latestComment->user->name]
                    : null,
                'created_at' => $this->latestComment->created_at?->toIso8601String(),
            ] : null),
            // ── نشاط التوجيه على البطاقة (خيط مفتوح — طلب أيمن 2026-08-29) ──
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

    /** هل للمهمة نشاط حديث (≤ 24 ساعة) لم يعلّمه المستخدم الحالي كمقروء؟ */
    private function hasUnreadActivity(): bool
    {
        if ($this->updated_at === null || $this->updated_at->lt(now()->subDay())) {
            return false; // لا نشاط حديث → لا جرس
        }

        if (! $this->relationLoaded('reads')) {
            return false; // خارج قائمة اللوحة لا نحسب الجرس
        }

        $read = $this->reads->first(); // مُصفّى مسبقًا لقراءة المستخدم الحالي

        return $read === null || $read->read_at === null || $read->read_at->lt($this->updated_at);
    }
}
