<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Followup;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Followup
 */
class FollowupResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => 'FUP-'.str_pad((string) $this->id, 3, '0', STR_PAD_LEFT),
            'contact_id' => $this->contact_id,
            'client_name' => $this->client_name,
            'channel' => $this->channel,
            'due_date' => $this->due_date?->toDateString(),
            'done' => (bool) $this->done,
            'priority' => $this->priority,
            'notes' => $this->notes,
            'stage' => $this->stage(),
            'assignee' => $this->whenLoaded('assignee', fn () => $this->assignee ? [
                'id' => $this->assignee->id,
                'name' => $this->assignee->name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
