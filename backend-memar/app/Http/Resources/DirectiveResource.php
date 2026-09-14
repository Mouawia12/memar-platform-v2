<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Comment;
use App\Models\Directive;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * خيط توجيه: رأسه توجيه الإدارة، وتحته ردوده وردود ردوده
 * (طلب أيمن 2026-08-29).
 *
 * @mixin Directive
 */
class DirectiveResource extends JsonResource
{
    /** صاحب البطاقة — به يُعرَف «تم الرد» ومَن يُنتظر ردّه. */
    public ?int $ownerId = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $last = $this->lastMessage();

        return [
            'id' => $this->id,
            'body' => $this->body,
            'sender' => $this->sender ? ['id' => $this->sender->id, 'name' => $this->sender->name] : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'messages' => $this->messages->map(fn (Comment $m): array => [
                'id' => $m->id,
                'body' => $m->body,
                'user' => $m->user ? ['id' => $m->user->id, 'name' => $m->user->name] : null,
                'created_at' => $m->created_at?->toIso8601String(),
            ])->values(),
            // آخر رسالة في الخيط — هي ما تعرضه البطاقة
            'last_message' => $last ? [
                'id' => $last->id,
                'body' => $last->body,
                'user' => $last->user ? ['id' => $last->user->id, 'name' => $last->user->name] : null,
                'created_at' => $last->created_at?->toIso8601String(),
            ] : null,
            // ردّ صاحب البطاقة مرّة واحدة على الأقلّ = ختم «تم الرد»
            'replied' => $this->isRepliedBy($this->ownerId),
        ];
    }
}
