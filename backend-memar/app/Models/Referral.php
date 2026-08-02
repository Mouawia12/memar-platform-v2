<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ReferralFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * إحالة عميل — «اقترحنا لصديق». حالتها: pending → joined → contracted (ناجحة).
 */
class Referral extends Model
{
    /** @use HasFactory<ReferralFactory> */
    use HasFactory;

    protected $fillable = [
        'referrer_contact_id', 'referred_name', 'status', 'is_gift',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_gift' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Contact, $this>
     */
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'referrer_contact_id');
    }
}
