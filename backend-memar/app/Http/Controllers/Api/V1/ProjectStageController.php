<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Projects\StoreStageCommentRequest;
use App\Http\Requests\Projects\StoreStageRequest;
use App\Http\Requests\Projects\UpdateStageRequest;
use App\Http\Resources\ProjectStageResource;
use App\Models\Project;
use App\Models\ProjectStage;
use App\Services\ProjectStageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * مراحل المشروع ومحادثاتها (PROJ-1/PROJ-2).
 */
class ProjectStageController extends ApiController
{
    public function __construct(private readonly ProjectStageService $stages) {}

    /** قائمة مراحل المشروع مع عدد رسائل كل مرحلة. */
    public function index(Project $project): JsonResponse
    {
        $stages = $project->stages()->withCount('comments')->get();

        return $this->ok(ProjectStageResource::collection($stages));
    }

    /** مرحلة واحدة مع سجل محادثتها كاملًا. */
    public function show(Project $project, ProjectStage $stage): JsonResponse
    {
        return $this->ok(new ProjectStageResource($stage->load('comments.user')));
    }

    /** توليد المراحل الافتراضية إن لم تكن للمشروع مراحل. */
    /** توزيع المشاريع على المراحل العامّة — بطاقة «مراحل المشاريع». */
    public function pipeline(): JsonResponse
    {
        return $this->ok($this->stages->pipeline());
    }

    /** كتالوج قوالب المراحل — تختار منه الواجهة قبل التوليد. */
    public function templates(): JsonResponse
    {
        return $this->ok($this->stages->templates());
    }

    /**
     * يزرع قالب مراحل في المشروع — إضافةً لا استبدالًا: ما كان من مراحل يبقى
     * بنقاشه وتواريخه، ومراحل القالب تُلحَق بعده (طلب أيمن 2026-08-31).
     */
    public function seedDefaults(Request $request, Project $project): JsonResponse
    {
        $data = $request->validate([
            // القوالب من القاعدة لا من الشيفرة — فقالب أنشأه المكتب يُزرع كأيّ قالب
            'template' => ['nullable', 'string', Rule::exists('stage_templates', 'key')],
        ]);

        $had = $project->stages()->exists();
        $added = $this->stages->seedDefaults($project, $data['template'] ?? null);

        return $this->ok(
            ProjectStageResource::collection($project->stages()->withCount('comments')->get()),
            match (true) {
                ! $had => 'تم إنشاء مراحل المشروع',
                $added === 0 => 'مراحل هذا القالب موجودة كلّها — لم يُضَف شيء',
                default => "تمت إضافة {$added} مراحل إلى مراحل المشروع",
            },
        );
    }

    public function store(StoreStageRequest $request, Project $project): JsonResponse
    {
        $stage = $this->stages->add($project, $request->validated());

        return $this->created(new ProjectStageResource($stage), 'تمت إضافة المرحلة');
    }

    public function update(UpdateStageRequest $request, Project $project, ProjectStage $stage): JsonResponse
    {
        $stage = $this->stages->update($stage, $request->validated());

        return $this->ok(new ProjectStageResource($stage), 'تم تحديث المرحلة');
    }

    /** إنهاء المرحلة الحالية وتفعيل التالية. */
    public function advance(Project $project, ProjectStage $stage): JsonResponse
    {
        $stage = $this->stages->advance($stage);

        return $this->ok(new ProjectStageResource($stage), 'تم تقديم المشروع للمرحلة التالية');
    }

    /**
     * بدء مرحلة منتظرة (تصبح «جارية») — متاح لأي مرحلة منتظرة، بما فيها المُدرَجة في
     * منتصف التسلسل. يُسمح بتداخل أكثر من مرحلة جارية (مثل التصميم والإشراف معًا).
     */
    public function activate(Project $project, ProjectStage $stage): JsonResponse
    {
        if ($stage->status !== 'pending') {
            return $this->fail('لا يمكن بدء إلا مرحلة منتظرة.', 422);
        }

        $stage = $this->stages->activate($stage);

        return $this->ok(new ProjectStageResource($stage), 'تم بدء المرحلة');
    }

    public function destroy(Project $project, ProjectStage $stage): JsonResponse
    {
        $this->stages->delete($stage);

        return $this->ok(null, 'تم حذف المرحلة');
    }

    /** إضافة رسالة إلى سجل محادثة المرحلة. */
    public function addComment(StoreStageCommentRequest $request, Project $project, ProjectStage $stage): JsonResponse
    {
        $user = $request->user();
        $comment = $this->stages->addComment($stage, $user, $request->string('body')->toString());

        return $this->created([
            'id' => $comment->id,
            'body' => $comment->body,
            'user' => ['id' => $user->id, 'name' => $user->name],
            'created_at' => $comment->created_at?->toIso8601String(),
        ], 'تمت إضافة الرسالة');
    }
}
