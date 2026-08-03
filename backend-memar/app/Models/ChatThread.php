<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * خيط محادثة للعميل مع طاقم معمار (اجتماع 2026-08-03، بند 8).
 * kind: team (الفريق) / support (الدعم الفني) / custom (محادثة أنشأها العميل).
 */
class ChatThread extends Model
{
    protected $fillable = ['contact_id', 'title', 'kind'];

    /**
     * @return BelongsTo<Contact, $this>
     */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * @return HasMany<ClientMessage, $this>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(ClientMessage::class);
    }

    /**
     * @return HasMany<ChatThreadParticipant, $this>
     */
    public function participants(): HasMany
    {
        return $this->hasMany(ChatThreadParticipant::class);
    }
}
