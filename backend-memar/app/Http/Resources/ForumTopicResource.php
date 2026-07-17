<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ForumReply;
use App\Models\ForumTopic;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ForumTopic
 */
class ForumTopicResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'views' => $this->views,
            'is_pinned' => $this->is_pinned,
            'replies_count' => $this->whenCounted('replies'),
            'category' => $this->whenLoaded('category', fn () => $this->category ? [
                'id' => $this->category->id,
                'name' => $this->category->name,
            ] : null),
            'author' => $this->whenLoaded('user', fn () => $this->user?->name ?? 'مستخدم'),
            'replies' => $this->whenLoaded('replies', fn () => $this->replies->map(fn (ForumReply $r): array => [
                'id' => $r->id,
                'body' => $r->body,
                'author' => $r->user?->name ?? 'مستخدم',
                'created_at' => $r->created_at?->toIso8601String(),
            ])),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
