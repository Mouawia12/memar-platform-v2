<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Invoice
 */
class InvoiceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $balance = (float) $this->total_kwd - (float) $this->paid_kwd;

        return [
            'id' => $this->id,
            'number' => $this->number,
            'subtotal_kwd' => $this->subtotal_kwd,
            'tax_kwd' => $this->tax_kwd,
            'total_kwd' => $this->total_kwd,
            'paid_kwd' => $this->paid_kwd,
            'balance_kwd' => number_format($balance, 3, '.', ''),
            'status' => $this->status,
            'issue_date' => $this->issue_date?->toDateString(),
            'due_date' => $this->due_date?->toDateString(),
            'is_overdue' => $this->due_date !== null
                && $this->due_date->isPast()
                && ! in_array($this->status, ['paid', 'cancelled'], true),
            'notes' => $this->notes,
            'client' => $this->whenLoaded('client', fn () => $this->client ? [
                'id' => $this->client->id,
                'name' => $this->client->full_name,
            ] : null),
            'project' => $this->whenLoaded('project', fn () => $this->project ? [
                'id' => $this->project->id,
                'name' => $this->project->name,
            ] : null),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
