<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Projects\StoreProjectRequest;
use App\Http\Requests\Projects\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Services\ProjectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends ApiController
{
    public function __construct(private readonly ProjectService $projects) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->projects->list(
            $request->string('search')->toString() ?: null,
            $request->string('status')->toString() ?: null,
            (int) ($request->integer('per_page') ?: 15),
        );

        return $this->paginated($paginator, ProjectResource::class);
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $project = $this->projects->create($request->validated());

        return $this->created(new ProjectResource($project), 'تم إنشاء المشروع');
    }

    public function show(Project $project): JsonResponse
    {
        return $this->ok(new ProjectResource($project->load(['client', 'manager'])));
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $project = $this->projects->update($project, $request->validated());

        return $this->ok(new ProjectResource($project), 'تم تحديث المشروع');
    }

    public function destroy(Project $project): JsonResponse
    {
        $this->projects->delete($project);

        return $this->ok(null, 'تم حذف المشروع');
    }
}
