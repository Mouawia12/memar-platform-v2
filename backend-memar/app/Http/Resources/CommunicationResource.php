<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Communication;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Communication
 */
class CommunicationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'contact_name' => $this->contact_name,
            'phone' => $this->phone,
            'channel' => $this->channel,
            'direction' => $this->direction,
            'subject' => $this->subject,
            'body' => $this->body,
            'happened_at' => $this->happened_at?->toIso8601String(),
            'logger' => $this->whenLoaded('logger', fn () => $this->logger ? [
                'id' => $this->logger->id,
                'name' => $this->logger->name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
