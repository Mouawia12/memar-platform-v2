<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * حركة واحدة في تايملاين الفرصة: مَن سجّلها، نوعها (اختصار)، الملاحظة، والموعد القادم.
 */
class OpportunityUpdate extends Model
{
    protected $fillable = ['contact_id', 'user_id', 'action_key', 'note', 'next_followup_at'];

    protected function casts(): array
    {
        return ['next_followup_at' => 'datetime'];
    }

    /** @return BelongsTo<Contact, $this> */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
