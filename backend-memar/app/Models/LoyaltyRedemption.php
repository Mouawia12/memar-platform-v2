<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * قسيمة استبدال: نقاط مصروفة → رصيد خصم بالدينار.
 * حالتها: available (متاحة) → applied (طُبِّقت على فاتورة) · expired.
 */
class LoyaltyRedemption extends Model
{
    protected $fillable = [
        'contact_id', 'code', 'points_spent', 'amount_kwd', 'status',
        'invoice_id', 'applied_at',
    ];

    protected function casts(): array
    {
        return [
            'points_spent' => 'integer',
            'amount_kwd' => 'decimal:3',
            'applied_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Contact, $this> */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    /** @return BelongsTo<Invoice, $this> */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
