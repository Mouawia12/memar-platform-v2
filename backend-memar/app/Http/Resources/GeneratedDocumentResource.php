<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\GeneratedDocument;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin GeneratedDocument
 */
class GeneratedDocumentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body_html' => $this->body_html,
            'template' => $this->whenLoaded('template', fn () => $this->template?->name),
            'project' => $this->whenLoaded('project', fn () => $this->project ? [
                'id' => $this->project->id,
                'name' => $this->project->name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
