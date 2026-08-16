<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * طلب استبدال نقاط موظف بالراتب. الحالة: pending → approved / rejected.
 */
class PointRedemptionRequest extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'user_id', 'points', 'amount_kwd', 'status', 'approved_by', 'approved_at', 'salary_id', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'points' => 'integer',
            'amount_kwd' => 'decimal:3',
            'approved_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<User, $this> */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /** @return BelongsTo<Salary, $this> */
    public function salary(): BelongsTo
    {
        return $this->belongsTo(Salary::class);
    }
}
