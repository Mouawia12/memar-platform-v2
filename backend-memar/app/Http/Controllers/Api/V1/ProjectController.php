<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Projects\ChangeStatusRequest;
use App\Http\Requests\Projects\StoreProjectRequest;
use App\Http\Requests\Projects\UpdateAssessmentRequest;
use App\Http\Requests\Projects\UpdateProjectRequest;
use App\Http\Resources\ContractResource;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\ProjectStageResource;
use App\Models\Contract;
use App\Models\GeneratedDocument;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\StoredFile;
use App\Services\ProjectOverviewService;
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
            $this->perPage($request, 15),
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

    /** نظرة شاملة: مؤشرات المشروع + تايم‌لاين أحداثه. */
    public function overview(Project $project, ProjectOverviewService $overview): JsonResponse
    {
        return $this->ok([
            'project' => new ProjectResource($project->load(['client:id,full_name', 'manager:id,name'])),
            'stages' => ProjectStageResource::collection($project->stages()->withCount('comments')->get()),
        ] + $overview->build($project));
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $project = $this->projects->update($project, $request->validated());

        return $this->ok(new ProjectResource($project), 'تم تحديث المشروع');
    }

    /** مستندات المشروع وعقده (PROJ-3): العقود + المستندات المولّدة + الملفات. */
    public function documents(Project $project): JsonResponse
    {
        $contracts = Contract::where('project_id', $project->id)
            ->with('client:id,full_name')
            ->latest()
            ->get();

        $documents = GeneratedDocument::where('project_id', $project->id)
            ->latest()
            ->get(['id', 'title', 'created_at']);

        $files = StoredFile::where('project_id', $project->id)
            ->latest()
            ->get(['id', 'name', 'original_name', 'extension', 'size', 'created_at']);

        return $this->ok([
            'contracts' => ContractResource::collection($contracts),
            'documents' => $documents->map(fn (GeneratedDocument $d) => [
                'id' => $d->id,
                'title' => $d->title,
                'created_at' => $d->created_at?->toIso8601String(),
            ])->all(),
            'files' => $files->map(fn (StoredFile $f) => [
                'id' => $f->id,
                'name' => $f->name,
                'original_name' => $f->original_name,
                'extension' => $f->extension,
                'size' => $f->size,
                'created_at' => $f->created_at?->toIso8601String(),
            ])->all(),
        ]);
    }

    /** دفعات المشروع (PROJ-3): فواتيره وملخّص المحصّل والمتبقّي. */
    public function payments(Project $project): JsonResponse
    {
        $invoices = Invoice::where('project_id', $project->id)
            ->with(['payments'])
            ->latest()
            ->get();

        $invoiced = round((float) $invoices->sum('total_kwd'), 3);
        $paid = round((float) $invoices->sum('paid_kwd'), 3);

        return $this->ok([
            'summary' => [
                'invoiced_kwd' => $invoiced,
                'paid_kwd' => $paid,
                'remaining_kwd' => round($invoiced - $paid, 3),
                'count' => $invoices->count(),
            ],
            'invoices' => InvoiceResource::collection($invoices),
        ]);
    }

    /** تغيير حالة المشروع مع تسجيل السبب في سجل التدقيق (PROJ-5). */
    public function changeStatus(ChangeStatusRequest $request, Project $project): JsonResponse
    {
        $project->statusChangeReason = $request->string('reason')->toString();
        $project->status = $request->string('status')->toString();
        $project->save();

        return $this->ok(new ProjectResource($project->load(['client', 'manager'])), 'تم تغيير حالة المشروع');
    }

    /** تقييم المشروع/العميل + VIP + ملاحظات داخلية سرية (PROJ-4). */
    public function updateAssessment(UpdateAssessmentRequest $request, Project $project): JsonResponse
    {
        $project->fill($request->validated())->save();

        return $this->ok(new ProjectResource($project->load(['client', 'manager'])), 'تم حفظ التقييم');
    }

    public function destroy(Project $project): JsonResponse
    {
        $this->projects->delete($project);

        return $this->ok(null, 'تم حذف المشروع');
    }
}
