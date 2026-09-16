<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ClientMessageFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * رسالة في محادثة العميل مع طاقم معمار. from_staff يميّز مرسل الطاقم عن العميل.
 */
class ClientMessage extends Model
{
    /** @use HasFactory<ClientMessageFactory> */
    use HasFactory;

    protected $fillable = [
        'contact_id', 'chat_thread_id', 'from_staff', 'body', 'sender_user_id', 'read_at', 'file_id',
    ];

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
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'from_staff' => 'boolean',
            'read_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Contact, $this>
     */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }
}
