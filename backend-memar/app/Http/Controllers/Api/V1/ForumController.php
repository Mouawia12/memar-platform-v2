<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Forum\StoreTopicRequest;
use App\Http\Resources\ForumTopicResource;
use App\Models\ForumReply;
use App\Models\ForumTopic;
use App\Services\ForumService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ForumController extends ApiController
{
    public function __construct(private readonly ForumService $forum) {}

    public function categories(): JsonResponse
    {
        return $this->ok($this->forum->categories()->map(fn ($c): array => [
            'id' => $c->id,
            'name' => $c->name,
            'slug' => $c->slug,
            'description' => $c->description,
            'topics_count' => $c->topics_count,
        ]));
    }

    public function topics(Request $request): JsonResponse
    {
        $paginator = $this->forum->listTopics(
            $request->integer('category_id') ?: null,
            $request->string('search')->toString() ?: null,
            (int) ($request->integer('per_page') ?: 15),
        );

        return $this->paginated($paginator, ForumTopicResource::class);
    }

    public function showTopic(ForumTopic $topic): JsonResponse
    {
        return $this->ok(new ForumTopicResource($this->forum->showTopic($topic)));
    }

    public function storeTopic(StoreTopicRequest $request): JsonResponse
    {
        $topic = $this->forum->createTopic($request->validated(), $request->user()?->id);

        return $this->created(new ForumTopicResource($topic), 'تم نشر الموضوع');
    }

    public function destroyTopic(ForumTopic $topic): JsonResponse
    {
        $this->forum->deleteTopic($topic);

        return $this->ok(null, 'تم حذف الموضوع');
    }

    public function storeReply(Request $request, ForumTopic $topic): JsonResponse
    {
        $validated = $request->validate(['body' => ['required', 'string']]);
        $this->forum->addReply($topic, $validated['body'], $request->user()?->id);

        return $this->created(new ForumTopicResource($this->forum->showTopic($topic)), 'تم إضافة الرد');
    }

    public function destroyReply(ForumReply $reply): JsonResponse
    {
        $this->forum->deleteReply($reply);

        return $this->ok(null, 'تم حذف الرد');
    }
}
