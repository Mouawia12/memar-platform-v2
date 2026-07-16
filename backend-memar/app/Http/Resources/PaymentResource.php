<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Payment
 */
class PaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'amount_kwd' => $this->amount_kwd,
            'method' => $this->method,
            'reference' => $this->reference,
            'paid_at' => $this->paid_at?->toDateString(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
