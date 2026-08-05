<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * تذكير متابعة على فرصة/عميل. due = حان وقته ولم يُنجَز بعد.
 */
class LeadReminder extends Model
{
    protected $fillable = ['contact_id', 'remind_at', 'note', 'done', 'created_by'];

    protected function casts(): array
    {
        return [
            'remind_at' => 'datetime',
            'done' => 'boolean',
        ];
    }

    /** @return BelongsTo<Contact, $this> */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
