<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * اطّلاع مستخدم على نشاط بطاقة — يُخفي جرس «جديد» عنده وحده
 * (كان task_reads قبل تعميمه على المتابعات).
 */
class ActivityRead extends Model
{
    protected $fillable = ['subject_type', 'subject_id', 'user_id', 'read_at'];

    /*
     * ميلي‑ثانية في الطابع: «جديد» يُقارن وقت الرسالة بوقت آخر اطّلاع، ورسالةٌ
     * تصل في ثانية الاطّلاع نفسها كانت تُعدّ مقروءة فيضيع تنبيهها (2026-08-31).
     */
    protected $dateFormat = 'Y-m-d H:i:s.v';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['read_at' => 'datetime'];
    }

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
