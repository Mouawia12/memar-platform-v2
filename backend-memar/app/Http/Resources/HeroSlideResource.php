<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\HeroSlide;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin HeroSlide
 */
class HeroSlideResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'cta_label' => $this->cta_label,
            'cta_url' => $this->cta_url,
            'bg_gradient' => $this->bg_gradient,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
        ];
    }
}
