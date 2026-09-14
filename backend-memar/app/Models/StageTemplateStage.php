<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** مرحلة داخل قالب — اسمها وأيامها المتوقّعة وتصنيفها العامّ. */
class StageTemplateStage extends Model
{
    protected $fillable = ['stage_template_id', 'name', 'expected_days', 'phase', 'position'];

    /** @return BelongsTo<StageTemplate, $this> */
    public function template(): BelongsTo
    {
        return $this->belongsTo(StageTemplate::class, 'stage_template_id');
    }
}
