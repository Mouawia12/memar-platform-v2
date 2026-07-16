<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Quotation;
use App\Models\QuotationItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Quotation
 */
class QuotationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'status' => $this->status,
            'subtotal_kwd' => $this->subtotal_kwd,
            'discount_kwd' => $this->discount_kwd,
            'total_kwd' => $this->total_kwd,
            'valid_until' => $this->valid_until?->toDateString(),
            'notes' => $this->notes,
            'client' => $this->whenLoaded('client', fn () => $this->client ? [
                'id' => $this->client->id,
                'name' => $this->client->full_name,
            ] : null),
            'project' => $this->whenLoaded('project', fn () => $this->project ? [
                'id' => $this->project->id,
                'name' => $this->project->name,
            ] : null),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn (QuotationItem $i): array => [
                'id' => $i->id,
                'service_id' => $i->service_id,
                'description' => $i->description,
                'qty' => $i->qty,
                'unit_price_kwd' => $i->unit_price_kwd,
                'total_kwd' => $i->total_kwd,
            ])),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
