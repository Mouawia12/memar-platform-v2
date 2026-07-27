<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * تفاصيل المهمة الكاملة (TASK-4): مُنشئ، مشاركون، محادثة، ملفات، فيديو، تقييم.
 *
 * @mixin Task
 */
class TaskDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $ref = fn ($u) => $u ? ['id' => $u->id, 'name' => $u->name] : null;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'due_date' => $this->due_date?->toDateString(),
            'rating' => $this->rating,
            'video_room' => $this->video_room,
            'project' => $this->project ? ['id' => $this->project->id, 'name' => $this->project->name] : null,
            'assignee' => $ref($this->assignee),
            'creator' => $ref($this->creator),
            'participants' => $this->participants->map($ref)->values(),
            'comments' => $this->comments->map(fn ($c) => [
                'id' => $c->id,
                'body' => $c->body,
                'user' => $ref($c->user),
                'created_at' => $c->created_at?->toIso8601String(),
            ])->values(),
            'files' => $this->files->map(fn ($f) => [
                'id' => $f->id,
                'name' => $f->name,
                'original_name' => $f->original_name,
                'extension' => $f->extension,
                'size' => $f->size,
                'created_at' => $f->created_at?->toIso8601String(),
            ])->values(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
