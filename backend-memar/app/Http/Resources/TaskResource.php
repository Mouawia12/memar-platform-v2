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
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            // نسبة إنجاز المهمة — تظهر كشريط تقدّم على البطاقة
            'progress' => (int) $this->progress,
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
            // آخر توجيه إداري — البطاقة تعرض حالته: «بانتظار الرد» أو «تم الرد»
            'directive' => $this->whenLoaded(
                'latestDirective',
                fn () => $this->latestDirective ? new DirectiveResource($this->latestDirective) : null,
            ),
            // عدد رسائل التوجيه على البطاقة (الرقم في الشارة)
            'directives_count' => (int) ($this->directives_count ?? 0),
            // ردود لم يطّلع عليها مُرسِلها بعد → شارة «تم الرد» على بطاقته وحده
            'directives_replied_unseen' => (int) ($this->replied_unseen_count ?? 0),
            // آخر توجيه ينتظر ردّي أنا (المكلَّف) → شارة «بانتظار ردّك»
            'directive_awaits_me' => $this->directiveAwaitsMe($request),
            // توجيه وصلني ولم أفتحه بعد → وميض «توجيه جديد» على بطاقتي
            'directive_is_new' => $this->directiveAwaitsMe($request)
                && $this->latestDirective?->seen_at === null,
        ];
    }

    /** هل آخر توجيه بلا ردّ وأنا المكلَّف بالمهمة؟ (الشارة الحمراء على بطاقتي) */
    private function directiveAwaitsMe(Request $request): bool
    {
        if (! $this->relationLoaded('latestDirective') || $this->latestDirective === null) {
            return false;
        }

        return $this->latestDirective->replied_at === null
            && $this->assignee_id !== null
            && $this->assignee_id === $request->user()?->id;
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
