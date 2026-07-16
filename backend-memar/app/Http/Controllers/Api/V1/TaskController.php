<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Tasks\StoreTaskRequest;
use App\Http\Requests\Tasks\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $task = $this->tasks->create($request->validated());

        return $this->created(new TaskResource($task), 'تم إنشاء المهمة');
    }

    public function show(Task $task): JsonResponse
    {
        return $this->ok(new TaskResource($task->load(['project', 'assignee'])));
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
