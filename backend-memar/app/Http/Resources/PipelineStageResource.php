<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\PipelineStage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PipelineStage
 */
class PipelineStageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'label' => $this->label,
            'color' => $this->color,
            'position' => $this->position,
            'is_won' => $this->is_won,
            'is_lost' => $this->is_lost,
            'is_protected' => $this->is_protected,
        ];
    }
}
