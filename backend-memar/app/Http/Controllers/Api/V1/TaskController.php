<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Tasks\StoreTaskRequest;
use App\Http\Requests\Tasks\UpdateTaskRequest;
use App\Http\Resources\CommentResource;
use App\Http\Resources\DirectiveResource;
use App\Http\Resources\TaskDetailResource;
use App\Http\Resources\TaskResource;
use App\Models\Directive;
use App\Models\StoredFile;
use App\Models\Task;
use App\Services\CardActivityService;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TaskController extends ApiController
{
    public function __construct(
        private readonly TaskService $tasks,
        private readonly CardActivityService $activity,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $tasks = $this->tasks->list(
            $request->string('search')->toString() ?: null,
            $request->integer('project_id') ?: null,
            $request->integer('assignee_id') ?: null,
        );

        return $this->ok(TaskResource::collection($tasks));
    }

    /** حِمل العمل لكل موظف (DASH-1). */
    public function workload(): JsonResponse
    {
        return $this->ok($this->tasks->workload());
    }

    /** يعلّم نشاط المهمة كمقروء للمستخدم الحالي (يُخفي جرس الإشعار عنده وحده). */
    public function markRead(Request $request, Task $task): JsonResponse
    {
        $this->tasks->markRead($task, (int) $request->user()->id);

        return $this->ok(null, 'تم التعليم كمقروء');
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $task = $this->tasks->create($request->validated(), $request->user()?->id);

        return $this->created(new TaskResource($task), 'تم إنشاء المهمة');
    }

    /** ترتيب بطاقات عمود في لوحة المهام بالسحب والإفلات (طلب 2026-09-15). */
    public function reorder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct'],
        ]);

        $this->tasks->reorder(array_map('intval', $data['ids']));

        return $this->ok(null, 'تم تحديث الترتيب');
    }

    /** تفاصيل المهمة الكاملة (مشاركون، محادثة، ملفات، فيديو، تقييم). */
    public function show(Task $task): JsonResponse
    {
        return $this->ok(new TaskDetailResource($this->tasks->detail($task)));
    }

    /** تعليقات المهمة — تُقرأ بإذن العرض (نافذة التعليقات على البطاقة). */
    public function comments(Request $request, Task $task): JsonResponse
    {
        $thread = CommentResource::collection($this->activity->comments($task));
        // فتح النافذة قراءةٌ — يُطفئ شارة «تعليق جديد» عن بطاقة هذا المستخدم وحده
        if ($userId = $request->user()?->id) {
            $this->tasks->markRead($task, (int) $userId);
        }

        return $this->ok($thread);
    }

    /** إضافة رسالة لمحادثة المهمة. */
    public function addComment(Request $request, Task $task): JsonResponse
    {
        $data = $request->validate(['body' => ['required', 'string', 'max:2000']]);
        $this->activity->addComment($task, $data['body'], $request->user()?->id);

        return $this->ok(new TaskDetailResource($this->tasks->detail($task)), 'تمت الإضافة');
    }

    /**
     * سجلّ التوجيهات الإدارية على المهمة (الأحدث أولًا) — خيط التوجيه والردّ.
     */
    public function directives(Request $request, Task $task): JsonResponse
    {
        $thread = $this->activity->directives($task)->map(function ($d) use ($task) {
            $res = new DirectiveResource($d);
            $res->ownerId = $task->activityOwnerId();

            return $res;
        });
        // فتح الخيط اطّلاعٌ — بعد قراءته كي تظهر الحالة السابقة في هذه الاستجابة
        $userId = $request->user()?->id;
        $this->activity->markDirectivesSeen($task, $userId);

        return $this->ok(DirectiveResource::collection($thread));
    }

    /** توجيه جديد من الإدارة على المهمة («أنجزها بسرعة»…). */
    public function sendDirective(Request $request, Task $task): JsonResponse
    {
        $data = $request->validate(['body' => ['required', 'string', 'max:1000']]);
        $directive = $this->activity->sendDirective($task, $data['body'], $request->user()?->id);

        return $this->created(new DirectiveResource($directive), 'تم إرسال التوجيه');
    }

    /**
     * رسالة في خيط التوجيه: ردّ المكلَّف، أو ردّ المُرسِل على ردّه، أو تعقيب من
     * الإدارة. الخيط مفتوح، وأطرافه: صاحب البطاقة ومشاركوها ومَن يوجّه إليها.
     */
    public function addDirectiveMessage(Request $request, Task $task, Directive $directive): JsonResponse
    {
        if ($directive->subject_type !== Task::class || $directive->subject_id !== $task->id) {
            return $this->fail('التوجيه لا يخصّ هذه المهمة', 404);
        }

        $userId = (int) $request->user()?->id;
        $allowed = $task->assignee_id === $userId
            || $directive->sender_id === $userId
            || $request->user()?->can('tasks.delete')
            || $task->participants()->where('users.id', $userId)->exists();

        if (! $allowed) {
            return $this->fail('المشاركة في خيط التوجيه لأطرافه', 403);
        }

        $data = $request->validate(['body' => ['required', 'string', 'max:1000']]);

        return $this->created(
            new CommentResource($this->activity->addDirectiveMessage($directive, $data['body'], $userId)),
            'تم إرسال الردّ',
        );
    }

    /** مزامنة مشاركي المهمة (المجموعة). */ /** مزامنة مشاركي المهمة (المجموعة). */
    public function syncParticipants(Request $request, Task $task): JsonResponse
    {
        $data = $request->validate([
            'user_ids' => ['present', 'array'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);
        $task = $this->tasks->syncParticipants($task, $data['user_ids']);

        return $this->ok(new TaskDetailResource($task), 'تم تحديث المشاركين');
    }

    /** رفع ملف وربطه بالمهمة. */
    public function uploadFile(Request $request, Task $task): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:10240', // 10MB
                'extensions:'.implode(',', ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'dwg', 'zip']),
            ],
        ]);
        $this->tasks->attachFile($task, $request->file('file'), $request->user()?->id);

        return $this->created(new TaskDetailResource($this->tasks->detail($task)), 'تم رفع الملف');
    }

    /** تنزيل ملف مرتبط بالمهمة. */
    public function downloadFile(Task $task, StoredFile $file): StreamedResponse
    {
        abort_unless($file->task_id === $task->id, 404);
        abort_unless(Storage::disk($file->disk)->exists($file->path), 404, 'الملف غير موجود');

        return Storage::disk($file->disk)->download($file->path, $file->original_name);
    }

    /** توليد/جلب غرفة الفيديو للمهمة. */
    public function videoRoom(Task $task): JsonResponse
    {
        return $this->ok(['room' => $this->tasks->ensureVideoRoom($task)]);
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $task = $this->tasks->update($task, $request->validated(), $request->user()?->id);

        return $this->ok(new TaskResource($task), 'تم تحديث المهمة');
    }

    public function destroy(Task $task): JsonResponse
    {
        $this->tasks->delete($task);

        return $this->ok(null, 'تم حذف المهمة');
    }
}
