<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * خبر داخلي يظهر على هيرو لوحة الموظف (قرار/إعلان/تنبيه/تحديث).
 */
class InternalNews extends Model
{
    protected $table = 'internal_news';

    protected $fillable = [
        'title', 'body', 'type', 'cta_label', 'cta_url', 'is_active', 'sort_order',
        'created_by', 'published_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
