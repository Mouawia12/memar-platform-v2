<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\FieldVisit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin FieldVisit
 */
class FieldVisitResource extends JsonResource
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
            'status' => $this->status,
            'visit_date' => $this->visit_date?->toIso8601String(),
            'location' => $this->location,
            'progress_pct' => $this->progress_pct,
            'findings' => $this->findings,
            'recommendations' => $this->recommendations,
            'project' => $this->whenLoaded('project', fn () => $this->project ? [
                'id' => $this->project->id,
                'name' => $this->project->name,
            ] : null),
            'engineer' => $this->whenLoaded('engineer', fn () => $this->engineer ? [
                'id' => $this->engineer->id,
                'name' => $this->engineer->name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
