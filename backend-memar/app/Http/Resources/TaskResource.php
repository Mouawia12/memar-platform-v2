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
            // رمز المهمة المشتقّ (TSK-0001) — طبق أصل كرت المهمة في المرجع.
            'code' => 'TSK-'.str_pad((string) $this->id, 4, '0', STR_PAD_LEFT),
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'progress' => (int) $this->progress,
            'department' => $this->department,
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
        ];
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
