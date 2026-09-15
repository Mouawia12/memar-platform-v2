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
            'contact_type' => $this->contact_type,
            'phone' => $this->phone,
            'channel' => $this->channel,
            'direction' => $this->direction,
            'subject' => $this->subject,
            'body' => $this->body,
            'contact_id' => $this->contact_id,
            'company_id' => $this->company_id,
            'user_id' => $this->user_id,
            // الجهة المربوطة (إن وُجدت) — اسمها الحالي قد يختلف عمّا حُفظ وقت التسجيل.
            'linked' => $this->linked(),
            'happened_at' => $this->happened_at?->toIso8601String(),
            'follow_up_at' => $this->follow_up_at?->toIso8601String(),
            'follow_up_done_at' => $this->follow_up_done_at?->toIso8601String(),
            'logger' => $this->whenLoaded('logger', fn () => $this->logger ? [
                'id' => $this->logger->id,
                'name' => $this->logger->name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array{type: string, id: int, name: string}|null
     */
    private function linked(): ?array
    {
        return match (true) {
            $this->contact_id !== null && $this->relationLoaded('contact') && $this->contact !== null => ['type' => 'client', 'id' => $this->contact->id, 'name' => $this->contact->full_name],
            $this->company_id !== null && $this->relationLoaded('company') && $this->company !== null => ['type' => 'company', 'id' => $this->company->id, 'name' => $this->company->name],
            $this->user_id !== null && $this->relationLoaded('staffUser') && $this->staffUser !== null => ['type' => 'staff', 'id' => $this->staffUser->id, 'name' => $this->staffUser->name],
            default => null,
        };
    }
}
