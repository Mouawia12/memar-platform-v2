<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\StoredFile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin StoredFile
 */
class StoredFileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'original_name' => $this->original_name,
            'mime' => $this->mime,
            'extension' => $this->extension,
            'size' => $this->size,
            'folder' => $this->folder,
            'notes' => $this->notes,
            'project' => $this->whenLoaded('project', fn () => $this->project ? [
                'id' => $this->project->id,
                'name' => $this->project->name,
            ] : null),
            'uploader' => $this->whenLoaded('uploader', fn () => $this->uploader ? [
                'id' => $this->uploader->id,
                'name' => $this->uploader->name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
