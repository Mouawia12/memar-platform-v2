<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * رسالة داخل محادثة الشات المباشر الداخلية.
 */
class ConversationMessage extends Model
{
    protected $fillable = ['conversation_id', 'sender_user_id', 'body', 'file_id', 'is_system', 'reply_to_id', 'mentions', 'edited_at', 'deleted_at'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['is_system' => 'boolean', 'mentions' => 'array', 'edited_at' => 'datetime', 'deleted_at' => 'datetime'];
    }

    /**
     * تفاعلات الرسالة (👍 ✅ …) — لكل مستخدم تفاعل واحد من كل رمز.
     *
     * @return HasMany<MessageReaction, $this>
     */
    public function reactions(): HasMany
    {
        return $this->hasMany(MessageReaction::class, 'message_id');
    }

    /**
     * الرسالة المُقتبَسة التي يردّ عليها هذا الردّ.
     *
     * @return BelongsTo<ConversationMessage, $this>
     */
    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reply_to_id');
    }

    /**
     * مرفق الرسالة — صورة أو ملف مخزّن على القرص الخاص.
     *
     * @return BelongsTo<StoredFile, $this>
     */
    public function file(): BelongsTo
    {
        return $this->belongsTo(StoredFile::class, 'file_id');
    }

    /**
     * @return BelongsTo<Conversation, $this>
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_user_id');
    }
}
