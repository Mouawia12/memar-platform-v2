<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Directive;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * توجيه إداري على المهمة + ردّ الموظف (طلب أيمن 2026-08-29).
 *
 * @mixin Directive
 */
class DirectiveResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'sender' => $this->sender ? ['id' => $this->sender->id, 'name' => $this->sender->name] : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'reply_body' => $this->reply_body,
            'replier' => $this->replier ? ['id' => $this->replier->id, 'name' => $this->replier->name] : null,
            'replied_at' => $this->replied_at?->toIso8601String(),
            // الواجهة تقرأ هذا مباشرة بدل مقارنة التواريخ عندها
            'replied' => $this->isReplied(),
        ];
    }
}
