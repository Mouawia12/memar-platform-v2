<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\JobApplication;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin JobApplication
 */
class JobApplicationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'applicant_name' => $this->applicant_name,
            'phone' => $this->phone,
            'email' => $this->email,
            'position' => $this->position,
            'experience' => $this->experience,
            'skills' => $this->skills,
            'message' => $this->message,
            'has_cv' => (bool) $this->cv_path,
            'cv_name' => $this->cv_original_name,
            'status' => $this->status,
            'notes' => $this->notes,
            'job' => $this->whenLoaded('jobOpening', fn () => $this->jobOpening ? [
                'id' => $this->jobOpening->id,
                'title' => $this->jobOpening->title,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
