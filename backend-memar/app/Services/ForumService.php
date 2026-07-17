<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ForumCategory;
use App\Models\ForumReply;
use App\Models\ForumTopic;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

/**
 * منطق المنتدى — الأقسام والمواضيع والردود.
 */
class ForumService
{
    /**
     * @return Collection<int, ForumCategory>
     */
    public function categories(): Collection
    {
        return ForumCategory::orderBy('order')->withCount('topics')->get();
    }

    public function listTopics(?int $categoryId, ?string $search, int $perPage = 15): LengthAwarePaginator
    {
        return ForumTopic::query()
            ->when($categoryId, fn ($q, int $id) => $q->where('category_id', $id))
            ->when($search, fn ($q, string $s) => $q->where('title', 'like', "%{$s}%"))
            ->with(['category', 'user'])
            ->withCount('replies')
            ->orderByDesc('is_pinned')
            ->latest()
            ->paginate($perPage);
    }

    public function showTopic(ForumTopic $topic): ForumTopic
    {
        $topic->increment('views');

        return $topic->load(['category', 'user', 'replies' => fn ($q) => $q->with('user')->oldest()]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createTopic(array $data, ?int $userId): ForumTopic
    {
        $topic = ForumTopic::create([...$data, 'user_id' => $userId]);

        return $topic->load(['category', 'user']);
    }

    public function deleteTopic(ForumTopic $topic): void
    {
        $topic->delete();
    }

    public function addReply(ForumTopic $topic, string $body, ?int $userId): ForumReply
    {
        $reply = $topic->replies()->create(['body' => $body, 'user_id' => $userId]);

        return $reply->load('user');
    }

    public function deleteReply(ForumReply $reply): void
    {
        $reply->delete();
    }
}
