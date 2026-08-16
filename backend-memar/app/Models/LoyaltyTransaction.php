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
    // دورة حياة النقاط (المرحلة 1 بنية؛ التحوّلات في المرحلة 2).
    public const STATUS_PENDING = 'pending';     // معلّقة — لم يتحقّق شرط الاستحقاق
    public const STATUS_EARNED = 'earned';       // مستحقة — بعد التعاقد، بانتظار اعتماد الإدارة
    public const STATUS_AVAILABLE = 'available';  // متاحة — قابلة للاستبدال
    public const STATUS_REDEEMED = 'redeemed';   // مستبدلة
    public const STATUS_CANCELLED = 'cancelled'; // ملغاة

    protected $fillable = [
        'contact_id', 'user_id', 'points', 'balance_after', 'source', 'status', 'description',
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
