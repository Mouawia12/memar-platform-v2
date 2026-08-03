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
            $this->perPage($request, 15),
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

    /**
     * تلقيمة المنتدى العامة (بلا مصادقة) — الأسئلة/الأجوبة التي اعتمدها الطاقم فقط (is_public)،
     * لتظهر على صفحة اللاندنج للزوّار (اجتماع 2026-08-03، بند 9). لا يُعرَض أي سؤال دون اعتماد.
     * يُخفى الاسم الكامل للسائل (الاسم الأول فقط)؛ وتُنسب الأجوبة لفريق معمار بأسمائهم.
     */
    public function publicFeed(): JsonResponse
    {
        $firstName = fn (?string $name): string => $name ? trim(explode(' ', trim($name))[0]) : 'عميل';

        $topics = ForumTopic::where('is_public', true)
            ->with(['user:id,name', 'replies' => fn ($q) => $q->with('user:id,name')->oldest()])
            ->latest()
            ->limit(20)
            ->get()
            ->map(function (ForumTopic $t) use ($firstName): array {
                $replies = $t->replies
                    ->filter(fn (ForumReply $r): bool => $r->user_id !== $t->user_id) // أجوبة الفريق فقط
                    ->map(fn (ForumReply $r): array => [
                        'author' => $r->user?->name ?? 'فريق معمار',
                        'body' => $r->body,
                        'at' => $r->created_at?->toIso8601String(),
                    ])->values()->all();

                return [
                    'id' => $t->id,
                    'title' => $t->title,
                    'body' => $t->body,
                    'asker' => $firstName($t->user?->name),
                    'answered' => $replies !== [],
                    'at' => $t->created_at?->toIso8601String(),
                    'answers' => $replies,
                ];
            })->all();

        return $this->ok($topics);
    }

    /** اعتماد/إلغاء اعتماد موضوع للعرض العام على اللاندنج (للطاقم). */
    public function setPublic(Request $request, ForumTopic $topic): JsonResponse
    {
        $data = $request->validate(['is_public' => ['required', 'boolean']]);
        $topic->update(['is_public' => $data['is_public']]);

        return $this->ok(['id' => $topic->id, 'is_public' => $topic->is_public], $topic->is_public ? 'تم عرض الموضوع علنًا' : 'تم إخفاء الموضوع');
    }
}
