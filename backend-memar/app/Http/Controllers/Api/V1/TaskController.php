<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Tasks\StoreTaskRequest;
use App\Http\Requests\Tasks\UpdateTaskRequest;
use App\Http\Resources\TaskDetailResource;
use App\Http\Resources\TaskResource;
use App\Models\StoredFile;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TaskController extends ApiController
{
    public function __construct(private readonly TaskService $tasks) {}

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

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $task = $this->tasks->create($request->validated(), $request->user()?->id);

        return $this->created(new TaskResource($task), 'تم إنشاء المهمة');
    }

    /** تفاصيل المهمة الكاملة (مشاركون، محادثة، ملفات، فيديو، تقييم). */
    public function show(Task $task): JsonResponse
    {
        return $this->ok(new TaskDetailResource($this->tasks->detail($task)));
    }

    /** إضافة رسالة لمحادثة المهمة. */
    public function addComment(Request $request, Task $task): JsonResponse
    {
        $data = $request->validate(['body' => ['required', 'string', 'max:2000']]);
        $this->tasks->addComment($task, $data['body'], $request->user()?->id);

        return $this->ok(new TaskDetailResource($this->tasks->detail($task)), 'تمت الإضافة');
    }

    /** مزامنة مشاركي المهمة (المجموعة). */
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
        $task = $this->tasks->update($task, $request->validated());

        return $this->ok(new TaskResource($task), 'تم تحديث المهمة');
    }

    public function destroy(Task $task): JsonResponse
    {
        $this->tasks->delete($task);

        return $this->ok(null, 'تم حذف المهمة');
    }
}
