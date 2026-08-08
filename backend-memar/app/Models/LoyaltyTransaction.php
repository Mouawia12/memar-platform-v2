<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * حركة نقاط ولاء واحدة في السجل — points موجب (كسب) أو سالب (صرف).
 * مصدر الحقيقة لرصيد العميل؛ يُكتب دائمًا عبر LoyaltyService بلا تعديل مباشر.
 */
class LoyaltyTransaction extends Model
{
    protected $fillable = [
        'contact_id', 'user_id', 'points', 'balance_after', 'source', 'description',
        'reference_type', 'reference_id',
    ];

    protected function casts(): array
    {
        return [
            'points' => 'integer',
            'balance_after' => 'integer',
        ];
    }

    /** @return BelongsTo<Contact, $this> */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    /** المُكتَسِب حين تكون الحركة لموظف (لا عميل). @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return MorphTo<Model, $this> */
    public function reference(): MorphTo
    {
        return $this->morphTo();
    }
}
