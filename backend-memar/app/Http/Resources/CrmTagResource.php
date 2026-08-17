<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\CrmTag;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin CrmTag
 */
class CrmTagResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'status' => $this->status,
            'requested_by' => $this->whenLoaded('requester', fn () => $this->requester?->name),
            'decided_by' => $this->whenLoaded('decider', fn () => $this->decider?->name),
            'decided_at' => $this->decided_at?->toDateString(),
            'created_at' => $this->created_at?->toDateString(),
        ];
    }
}
