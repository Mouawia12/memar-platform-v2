<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Appointment
 */
class AppointmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'type' => $this->type,
            'start_at' => $this->start_at?->toIso8601String(),
            'end_at' => $this->end_at?->toIso8601String(),
            'location' => $this->location,
            'location_kind' => $this->location_kind,
            'is_video' => $this->is_video,
            'video_room' => $this->video_room,
            'video_url' => $this->is_video && $this->video_room ? "https://meet.jit.si/{$this->video_room}" : null,
            'status' => $this->status,
            'notes' => $this->notes,
            'project' => $this->whenLoaded('project', fn () => $this->project ? [
                'id' => $this->project->id,
                'name' => $this->project->name,
            ] : null),
            // الموظف المكلَّف — يظهر اسمه في القوائم والتقويم (طلب أيمن 2026-08-31)
            'assignee' => $this->whenLoaded('assignee', fn () => $this->assignee ? [
                'id' => $this->assignee->id,
                'name' => $this->assignee->name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
