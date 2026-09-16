<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * تفاعل سريع على رسالة في الشات (👍 ✅ ❗…) — بديلٌ عن ردٍّ كامل.
 */
class MessageReaction extends Model
{
    protected $table = 'conversation_message_reactions';

    protected $fillable = ['message_id', 'user_id', 'emoji'];

    /** @return BelongsTo<ConversationMessage, $this> */
    public function message(): BelongsTo
    {
        return $this->belongsTo(ConversationMessage::class, 'message_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
