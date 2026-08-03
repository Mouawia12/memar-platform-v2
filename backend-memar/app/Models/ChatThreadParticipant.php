<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * مشارك في خيط محادثة العميل — موظف/مهندس أو عضو أضافه العميل (اجتماع 2026-08-03، بند 8).
 */
class ChatThreadParticipant extends Model
{
    protected $fillable = ['chat_thread_id', 'user_id', 'name', 'role'];

    /**
     * @return BelongsTo<ChatThread, $this>
     */
    public function thread(): BelongsTo
    {
        return $this->belongsTo(ChatThread::class, 'chat_thread_id');
    }
}
