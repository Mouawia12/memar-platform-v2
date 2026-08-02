<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Pipeline\ReorderPipelineStagesRequest;
use App\Http\Requests\Pipeline\StorePipelineStageRequest;
use App\Http\Requests\Pipeline\UpdatePipelineStageRequest;
use App\Http\Resources\PipelineStageResource;
use App\Models\Contact;
use App\Models\PipelineStage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

/**
 * مراحل مسار الفرص (CRM) — أعمدة اللوحة القابلة للتعديل والإضافة.
 */
class PipelineStageController extends ApiController
{
    public function index(): JsonResponse
    {
        $stages = PipelineStage::query()->orderBy('position')->orderBy('id')->get();

        return $this->ok(PipelineStageResource::collection($stages));
    }

    public function store(StorePipelineStageRequest $request): JsonResponse
    {
        $data = $request->validated();

        $stage = PipelineStage::create([
            'key' => 'stage_'.Str::lower(Str::random(10)),
            'label' => $data['label'],
            'color' => $data['color'] ?? '#6B7280',
            // العمود الجديد يُدرَج قبل المراحل المحميّة (رابحة/خسارة) افتراضيًا
            'position' => $data['position'] ?? ((int) PipelineStage::where('is_protected', false)->max('position') + 1),
            'is_won' => false,
            'is_lost' => false,
            'is_protected' => false,
        ]);

        return $this->created(new PipelineStageResource($stage), 'تمت إضافة المرحلة');
    }

    public function update(UpdatePipelineStageRequest $request, PipelineStage $pipelineStage): JsonResponse
    {
        $pipelineStage->update($request->validated());

        return $this->ok(new PipelineStageResource($pipelineStage), 'تم تحديث المرحلة');
    }

    public function reorder(ReorderPipelineStagesRequest $request): JsonResponse
    {
        foreach ($request->validated()['ids'] as $index => $id) {
            PipelineStage::where('id', $id)->update(['position' => $index + 1]);
        }

        $stages = PipelineStage::query()->orderBy('position')->orderBy('id')->get();

        return $this->ok(PipelineStageResource::collection($stages), 'تم ترتيب المراحل');
    }

    public function destroy(PipelineStage $pipelineStage): JsonResponse
    {
        if ($pipelineStage->is_protected) {
            return $this->fail('لا يمكن حذف مرحلة أساسية (صفقة رابحة/خسارة).', 422);
        }

        if (Contact::where('stage', $pipelineStage->key)->exists()) {
            return $this->fail('لا يمكن حذف المرحلة لوجود فرص بها — انقل الفرص أولًا.', 422);
        }

        $pipelineStage->delete();

        return $this->ok(null, 'تم حذف المرحلة');
    }
}
