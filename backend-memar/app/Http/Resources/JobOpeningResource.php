<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\JobOpening;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin JobOpening
 */
class JobOpeningResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'department' => $this->department,
            'employment_type' => $this->employment_type,
            'location' => $this->location,
            'description' => $this->description,
            'requirements' => $this->requirements,
            'salary_range' => $this->salary_range,
            'status' => $this->status,
            'applicants_count' => $this->applicants_count,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
