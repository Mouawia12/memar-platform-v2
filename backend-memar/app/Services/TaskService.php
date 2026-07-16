<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Task;
use Illuminate\Database\Eloquent\Collection;

/**
 * منطق إدارة المهام (لوحة Kanban).
 */
class TaskService
{
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
            ->orderBy('position')
            ->latest()
            ->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Task
    {
        return Task::create($data)->load(['project', 'assignee']);
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
