<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\StoredFile;
use App\Models\Task;
use App\Models\TaskComment;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

/**
 * منطق إدارة المهام (لوحة المتابعة + صفحة التفاصيل).
 */
class TaskService
{
    public function __construct(private readonly FileStorageService $files) {}

    /**
     * قائمة المهام (للوحة Kanban — بدون تصفّح، مجمّعة على الواجهة).
     *
     * @return Collection<int, Task>
     */
    public function list(?string $search, ?int $projectId, ?int $assigneeId): Collection
    {
        return Task::query()
            ->when($search, fn ($q, string $s) => $q->where('title', 'like', "%{$s}%"))
            ->when($projectId, fn ($q, int $id) => $q->where('project_id', $id))
            ->when($assigneeId, fn ($q, int $id) => $q->where('assignee_id', $id))
            ->with(['project', 'assignee'])
            ->withCount('comments')
            ->orderBy('position')
            ->latest()
            ->get();
    }

    /**
     * حِمل العمل لكل موظف (DASH-1): عدد مهامه حسب الحالة + المتأخرة.
     * مرتّب تنازليًا حسب المهام المفتوحة (غير المنجزة) ثم الإجمالي.
     *
     * @return array<int, array<string, mixed>>
     */
    public function workload(): array
    {
        $today = now()->startOfDay();

        return Task::query()
            ->whereNotNull('assignee_id')
            ->with('assignee:id,name')
            ->get()
            ->groupBy('assignee_id')
            ->map(function (Collection $tasks) use ($today): array {
                $first = $tasks->first();
                $done = $tasks->where('status', 'done')->count();
                $overdue = $tasks->filter(
                    fn (Task $t): bool => $t->due_date !== null && $t->due_date->lt($today) && $t->status !== 'done',
                )->count();

                return [
                    'user' => ['id' => $first->assignee_id, 'name' => $first->assignee?->name ?? '—'],
                    'total' => $tasks->count(),
                    'todo' => $tasks->where('status', 'todo')->count(),
                    'in_progress' => $tasks->where('status', 'in_progress')->count(),
                    'review' => $tasks->where('status', 'review')->count(),
                    'done' => $done,
                    'open' => $tasks->count() - $done,
                    'overdue' => $overdue,
                ];
            })
            ->sortByDesc(fn (array $r): array => [$r['open'], $r['total']])
            ->values()
            ->all();
    }

    /** تفاصيل مهمة كاملة (المشاركون، المحادثة، الملفات…). */
    public function detail(Task $task): Task
    {
        return $task->load([
            'project:id,name', 'assignee:id,name', 'creator:id,name',
            'participants:id,name', 'comments.user:id,name', 'files',
            // سجل التعديلات (اجتماع 2026-08-05): آخر 20 حركة من سجل النشاط.
            'activities' => fn ($q) => $q->with('causer:id,name')->latest()->limit(20),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $creatorId = null): Task
    {
        $participants = $data['participant_ids'] ?? null;
        unset($data['participant_ids']);

        $data['created_by'] = $creatorId;
        $task = Task::create($data);

        if (is_array($participants)) {
            $task->participants()->sync($participants);
        }

        return $task->load(['project', 'assignee']);
    }

    /** إضافة رسالة لمحادثة المهمة. */
    public function addComment(Task $task, string $body, ?int $userId): TaskComment
    {
        return $task->comments()->create(['user_id' => $userId, 'body' => $body])->load('user:id,name');
    }

    /**
     * مزامنة المشاركين (المجموعة).
     *
     * @param  array<int, int>  $userIds
     */
    public function syncParticipants(Task $task, array $userIds): Task
    {
        $task->participants()->sync($userIds);

        return $this->detail($task);
    }

    /** رفع ملف وربطه بالمهمة (وبمشروعها إن وُجد). */
    public function attachFile(Task $task, UploadedFile $file, ?int $userId): StoredFile
    {
        return $this->files->store($file, [
            'task_id' => $task->id,
            'project_id' => $task->project_id,
            'folder' => 'مهام',
        ], $userId);
    }

    /** توليد غرفة فيديو للمهمة إن لم توجد، وإرجاع اسمها. */
    public function ensureVideoRoom(Task $task): string
    {
        if (! $task->video_room) {
            $task->update(['video_room' => 'memar-task-'.$task->id.'-'.Str::lower(Str::random(6))]);
        }

        return (string) $task->video_room;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Task $task, array $data): Task
    {
        $task->update($data);

        return $task->load(['project', 'assignee']);
    }

    public function delete(Task $task): void
    {
        $task->delete();
    }
}
