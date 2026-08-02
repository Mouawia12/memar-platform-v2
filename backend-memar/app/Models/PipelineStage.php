<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * مرحلة واحدة في مسار الفرص (CRM) — قابلة للتعديل والإضافة من الأدمن.
 */
class PipelineStage extends Model
{
    protected $fillable = [
        'key', 'label', 'color', 'position', 'is_won', 'is_lost', 'is_protected',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'is_won' => 'boolean',
            'is_lost' => 'boolean',
            'is_protected' => 'boolean',
        ];
    }
}
