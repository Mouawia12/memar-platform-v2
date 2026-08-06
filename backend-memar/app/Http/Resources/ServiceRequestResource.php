<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ServiceRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ServiceRequest
 */
class ServiceRequestResource extends JsonResource
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
            'client_name' => $this->client_name,
            'contact_phone' => $this->contact_phone,
            'priority' => $this->priority,
            'status' => $this->status,
            'description' => $this->description,
            'requester' => $this->whenLoaded('requester', fn () => $this->requester ? [
                'id' => $this->requester->id,
                'name' => $this->requester->name,
            ] : null),
            'assigned_to' => $this->assigned_to,
            'assignee' => $this->whenLoaded('assignee', fn () => $this->assignee ? [
                'id' => $this->assignee->id,
                'name' => $this->assignee->name,
            ] : null),
            'attachments' => $this->whenLoaded('files', fn () => $this->files->map(fn ($f) => [
                'id' => $f->id,
                'original_name' => $f->original_name,
                'size' => $f->size,
            ])->all()),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
