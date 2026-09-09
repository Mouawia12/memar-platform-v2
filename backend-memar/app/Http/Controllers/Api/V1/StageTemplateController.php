<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Projects\SaveStageTemplateRequest;
use App\Models\StageTemplate;
use App\Services\ProjectStageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * إدارة قوالب المراحل (طلب أيمن 2026-09-09): المكتب يضيف قوالب جديدة كليًّا
 * ويعدّل القائمة ويحذف ما لا يلزمه — بلا مساس بمراحل أيّ مشروع قائم.
 */
class StageTemplateController extends ApiController
{
    public function __construct(private readonly ProjectStageService $stages) {}

    public function store(SaveStageTemplateRequest $request): JsonResponse
    {
        $template = DB::transaction(function () use ($request): StageTemplate {
            $t = StageTemplate::create([
                'key' => $this->freshKey($request->string('label')->toString()),
                'label' => $request->string('label')->toString(),
                'hint' => $request->input('hint'),
                'is_system' => false,
                'position' => (int) (StageTemplate::max('position') ?? -1) + 1,
            ]);
            $this->writeStages($t, $request->array('stages'));

            return $t;
        });

        return $this->created(['key' => $template->key, 'templates' => $this->stages->templates()], 'تم إنشاء القالب');
    }

    public function update(SaveStageTemplateRequest $request, StageTemplate $stageTemplate): JsonResponse
    {
        DB::transaction(function () use ($request, $stageTemplate): void {
            $stageTemplate->update([
                'label' => $request->string('label')->toString(),
                'hint' => $request->input('hint'),
            ]);
            // مراحل القالب وصفةٌ لا سجلّ: تُكتب كما أرسلها المكتب.
            $stageTemplate->stages()->delete();
            $this->writeStages($stageTemplate, $request->array('stages'));
        });

        return $this->ok(['templates' => $this->stages->templates()], 'تم حفظ القالب');
    }

    public function destroy(StageTemplate $stageTemplate): JsonResponse
    {
        $stageTemplate->delete();

        return $this->ok(
            ['templates' => $this->stages->templates()],
            'حُذف القالب — ومراحل المشاريع المزروعة منه لم تُمسّ',
        );
    }

    /** مفتاح لا يصطدم بقالبٍ قائم — والاسم العربي قد لا يُنتج نصًّا لاتينيًّا. */
    private function freshKey(string $label): string
    {
        $base = Str::slug($label) ?: 'template';
        $key = $base;
        $i = 2;
        while (StageTemplate::where('key', $key)->exists()) {
            $key = "{$base}-{$i}";
            $i++;
        }

        return $key;
    }

    /** @param  array<int, array<string, mixed>>  $rows */
    private function writeStages(StageTemplate $template, array $rows): void
    {
        foreach (array_values($rows) as $i => $row) {
            $template->stages()->create([
                'name' => trim((string) $row['name']),
                'expected_days' => $row['expected_days'] ?? null,
                'phase' => $row['phase'] ?? null,
                'position' => $i,
            ]);
        }
    }
}
