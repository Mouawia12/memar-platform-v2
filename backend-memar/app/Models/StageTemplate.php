<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * قالب مراحل يملكه المكتب: وصفةٌ لمسار مشروع، لا رابطة به.
 * تعديل القالب أو حذفه لا يمسّ مراحل أيّ مشروع زُرع منه من قبل.
 */
class StageTemplate extends Model
{
    use HasFactory;

    protected $fillable = ['key', 'label', 'hint', 'is_system', 'position'];

    protected function casts(): array
    {
        return ['is_system' => 'boolean'];
    }

    /** @return HasMany<StageTemplateStage, $this> */
    public function stages(): HasMany
    {
        return $this->hasMany(StageTemplateStage::class)->orderBy('position');
    }
}
