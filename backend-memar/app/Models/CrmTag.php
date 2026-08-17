<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * اختصار (وسم) فرصة — كتالوج + طلبات اعتماد (طبق أصل V42 opsTagList/pendingTags).
 * status: approved = ظاهر على السيستم · pending = بانتظار اعتماد الإدارة · rejected = مرفوض.
 */
class CrmTag extends Model
{
    protected $fillable = ['name', 'status', 'requested_by', 'decided_by', 'decided_at'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['decided_at' => 'datetime'];
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function decider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }
}
