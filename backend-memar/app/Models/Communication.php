<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Communication extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'contact_name', 'contact_type', 'contact_id', 'company_id', 'user_id', 'phone', 'channel', 'direction',
        'subject', 'body', 'happened_at', 'follow_up_at', 'follow_up_done_at', 'logged_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'happened_at' => 'datetime',
            'follow_up_at' => 'datetime',
            'follow_up_done_at' => 'datetime',
        ];
    }

    public function logger(): BelongsTo
    {
        return $this->belongsTo(User::class, 'logged_by');
    }

    /** @return BelongsTo<Contact, $this> */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    /** @return BelongsTo<Company, $this> */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /** @return BelongsTo<User, $this> */
    public function staffUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * متابعات حان موعدها ولم تُنجز بعد.
     *
     * @param  Builder<Communication>  $query
     */
    public function scopeFollowUpDue(Builder $query): void
    {
        $query->whereNotNull('follow_up_at')->where('follow_up_at', '<=', now())->whereNull('follow_up_done_at');
    }
}
