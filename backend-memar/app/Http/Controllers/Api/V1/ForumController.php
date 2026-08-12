<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Forum\StoreTopicRequest;
use App\Http\Resources\ForumTopicResource;
use App\Models\ForumCategory;
use App\Models\ForumReply;
use App\Models\ForumTopic;
use App\Models\User;
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

    public function destroyTopic(Request $request, ForumTopic $topic): JsonResponse
    {
        // لا يحذف الموضوع إلا صاحبه أو من يملك إدارة المنتدى (طلب أيمن 2026-08-12).
        abort_unless(
            $request->user()?->id === $topic->user_id || (bool) $request->user()?->can('forum.manage'),
            403,
            'لا تملك صلاحية حذف هذا الموضوع',
        );

        $this->forum->deleteTopic($topic);

        return $this->ok(null, 'تم حذف الموضوع');
    }

    public function storeReply(Request $request, ForumTopic $topic): JsonResponse
    {
        $validated = $request->validate(['body' => ['required', 'string']]);
        $this->forum->addReply($topic, $validated['body'], $request->user()?->id);

        return $this->created(new ForumTopicResource($this->forum->showTopic($topic)), 'تم إضافة الرد');
    }

    public function destroyReply(Request $request, ForumReply $reply): JsonResponse
    {
        // لا يحذف الرد إلا صاحبه أو من يملك إدارة المنتدى (طلب أيمن 2026-08-12).
        abort_unless(
            $request->user()?->id === $reply->user_id || (bool) $request->user()?->can('forum.manage'),
            403,
            'لا تملك صلاحية حذف هذا الرد',
        );

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
            ->with(['user:id,name', 'replies' => fn ($q) => $q->with('user:id,name,contact_id')->oldest()])
            ->latest()
            ->limit(20)
            ->get()
            ->map(function (ForumTopic $t) use ($firstName): array {
                // أجوبة الطاقم فقط: مستخدم موجود، ليس السائل، وليس عميلًا (contact_id = null = طاقم معمار).
                // يمنع تسرّب رد أي عميل آخر للعرض العام.
                $replies = $t->replies
                    ->filter(fn (ForumReply $r): bool => $r->user && $r->user_id !== $t->user_id && $r->user->contact_id === null)
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

    /**
     * لوحة المنتدى الموحّدة (لكل الأدوار) — نفس شكل بيانات بوابة العميل وعلى الجدول المشترك،
     * بعرض كل المواضيع. ردود الإدارة (مستخدم بلا سجل عميل) مميّزة بـ from_staff.
     */
    public function board(Request $request): JsonResponse
    {
        $viewerId = $request->user()?->id;
        $isStaff = fn (?User $u): bool => $u !== null && $u->contact_id === null;

        $topics = ForumTopic::with(['user:id,name,contact_id', 'replies' => fn ($q) => $q->with('user:id,name,contact_id')->oldest()])
            ->latest()
            ->limit(100)
            ->get()
            ->map(function (ForumTopic $t) use ($viewerId, $isStaff): array {
                $replies = $t->replies->map(function (ForumReply $r) use ($isStaff): array {
                    $staff = $isStaff($r->user);

                    return [
                        'id' => $r->id,
                        'from_staff' => $staff,
                        'author' => $r->user?->name ?? ($staff ? 'فريق معمار' : 'عضو'),
                        'body' => $r->body,
                        'attachments' => $r->attachments ?? [],
                        'at' => $r->created_at?->toIso8601String(),
                    ];
                })->all();
                $answered = collect($replies)->contains('from_staff', true);

                return [
                    'id' => $t->id,
                    'title' => $t->title,
                    'body' => $t->body,
                    'author' => $t->user?->name ?? 'عضو',
                    'is_mine' => $t->user_id === $viewerId,
                    'status' => $answered ? 'answered' : 'open',
                    'status_label' => $answered ? 'تمت الإجابة' : 'سؤال',
                    'created_at' => $t->created_at?->toIso8601String(),
                    'replies' => $replies,
                ];
            })->all();

        return $this->ok($topics);
    }

    /** نشر موضوع من لوحة المنتدى الموحّدة (عنوان + تفاصيل، بلا اختيار قسم). */
    public function storeBoardTopic(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['nullable', 'string', 'max:5000'],
        ]);

        $categoryId = ForumCategory::query()->orderBy('order')->value('id')
            ?? ForumCategory::create(['name' => 'عام', 'slug' => 'general', 'order' => 1])->id;

        $topic = ForumTopic::create([
            'category_id' => $categoryId,
            'user_id' => $request->user()->id,
            'title' => $data['title'],
            'body' => ($data['body'] ?? '') ?: $data['title'],
        ]);

        return $this->created(['id' => $topic->id], 'تم نشر الموضوع');
    }

    /** اعتماد/إلغاء اعتماد موضوع للعرض العام على اللاندنج (للطاقم). */
    public function setPublic(Request $request, ForumTopic $topic): JsonResponse
    {
        $data = $request->validate(['is_public' => ['required', 'boolean']]);
        $topic->update(['is_public' => $data['is_public']]);

        return $this->ok(['id' => $topic->id, 'is_public' => $topic->is_public], $topic->is_public ? 'تم عرض الموضوع علنًا' : 'تم إخفاء الموضوع');
    }
}
