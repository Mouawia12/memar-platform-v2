<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectStage;
use App\Models\ProjectStageComment;
use App\Models\StageTemplate;
use App\Models\StageTemplateStage;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * منطق مراحل المشروع (PROJ-1/PROJ-2): توليد المراحل الافتراضية،
 * إضافة/تعديل/حذف مرحلة، تقديم المشروع للمرحلة التالية، ومحادثة كل مرحلة.
 */
class ProjectStageService
{
    /**
     * قوالب المراحل — لا كل مشروع يمرّ بالمسار نفسه (طلب أيمن 2026-08-31):
     * رخصة التعديل لا تحتاج تصميمًا داخليًّا، والإشراف وحده لا يحتاج ترخيصًا.
     * المفتاح الأول هو الافتراضي لمن لم يختر.
     *
     * @var array<string, array{label: string, hint: string, stages: array<int, array{name: string, expected_days: int}>}>
     */
    /**
     * بذرة القوالب الأولى فقط — نُقلت إلى جدول stage_templates بترحيل
     * 2026_09_09_120000، وصارت الخدمة تقرأ من القاعدة. تبقى هنا مرجعًا
     * للترحيل ولتهيئة قاعدة جديدة، ولا تُقرأ في التشغيل.
     */
    public const TEMPLATES = [
        'full_design' => [
            'label' => 'مشروع تصميم متكامل',
            'hint' => 'من الدراسات حتى التسليم — المسار الكامل لفيلا أو مبنى جديد.',
            'stages' => [
                ['name' => 'دراسات أولية', 'expected_days' => 7, 'phase' => 'collect'],
                ['name' => 'تصميم معماري', 'expected_days' => 21, 'phase' => 'design'],
                ['name' => 'تصميم إنشائي', 'expected_days' => 21, 'phase' => 'design'],
                ['name' => 'الترخيص', 'expected_days' => 30, 'phase' => 'permit'],
                ['name' => 'تصميم داخلي', 'expected_days' => 21, 'phase' => 'design'],
                ['name' => 'إشراف تنفيذ', 'expected_days' => 60, 'phase' => 'supervise'],
                ['name' => 'تسليم نهائي', 'expected_days' => 7, 'phase' => 'handover'],
            ],
        ],
        'permit_amendment' => [
            'label' => 'رخصة تعديل',
            'hint' => 'تعديل على مبنى قائم — بلا تصميم داخلي ولا إشراف طويل.',
            'stages' => [
                ['name' => 'معاينة الوضع القائم', 'expected_days' => 3, 'phase' => 'collect'],
                ['name' => 'رفع مساحي ومخطط قائم', 'expected_days' => 7, 'phase' => 'collect'],
                ['name' => 'مخطط التعديل المقترح', 'expected_days' => 10, 'phase' => 'design'],
                ['name' => 'اعتماد العميل', 'expected_days' => 5, 'phase' => 'design'],
                ['name' => 'تقديم الرخصة ومتابعتها', 'expected_days' => 30, 'phase' => 'permit'],
                ['name' => 'تسليم الرخصة', 'expected_days' => 3, 'phase' => 'handover'],
            ],
        ],
        'permit_only' => [
            'label' => 'ترخيص فقط',
            'hint' => 'المخططات جاهزة من مكتب آخر، ودورنا تجهيز الملف وإصداره.',
            'stages' => [
                ['name' => 'مراجعة المخططات المستلمة', 'expected_days' => 5, 'phase' => 'collect'],
                ['name' => 'تجهيز ملف الرخصة', 'expected_days' => 7, 'phase' => 'permit'],
                ['name' => 'التقديم ومتابعة البلدية', 'expected_days' => 30, 'phase' => 'permit'],
                ['name' => 'تسليم الرخصة', 'expected_days' => 3, 'phase' => 'handover'],
            ],
        ],
        'supervision_only' => [
            'label' => 'إشراف تنفيذ فقط',
            'hint' => 'العميل يملك التصميم والرخصة، ودورنا الإشراف حتى التسليم.',
            'stages' => [
                ['name' => 'استلام الموقع والمخططات', 'expected_days' => 5, 'phase' => 'collect'],
                ['name' => 'أعمال الأساسات', 'expected_days' => 45, 'phase' => 'supervise'],
                ['name' => 'الهيكل الخرساني', 'expected_days' => 90, 'phase' => 'supervise'],
                ['name' => 'التشطيبات', 'expected_days' => 60, 'phase' => 'supervise'],
                ['name' => 'الاستلام النهائي', 'expected_days' => 10, 'phase' => 'handover'],
            ],
        ],
        'interior' => [
            'label' => 'تصميم داخلي',
            'hint' => 'شقة أو مكتب أو محل — تصميم وتنفيذ داخلي بلا ترخيص.',
            'stages' => [
                ['name' => 'المعاينة وأخذ المقاسات', 'expected_days' => 3, 'phase' => 'collect'],
                ['name' => 'المفهوم التصميمي (Mood Board)', 'expected_days' => 7, 'phase' => 'design'],
                ['name' => 'التصميم ثلاثي الأبعاد', 'expected_days' => 14, 'phase' => 'design'],
                ['name' => 'اعتماد العميل', 'expected_days' => 5, 'phase' => 'design'],
                ['name' => 'مخططات التنفيذ والكميات', 'expected_days' => 10, 'phase' => 'shop'],
                ['name' => 'الإشراف على التنفيذ', 'expected_days' => 45, 'phase' => 'supervise'],
                ['name' => 'التسليم', 'expected_days' => 5, 'phase' => 'handover'],
            ],
        ],
        'study' => [
            'label' => 'دراسة واستشارة',
            'hint' => 'دراسة جدوى أو رأي فنّي — بلا مخططات تنفيذية.',
            'stages' => [
                ['name' => 'جمع المتطلبات', 'expected_days' => 5, 'phase' => 'collect'],
                ['name' => 'الدراسة والتحليل', 'expected_days' => 14, 'phase' => 'design'],
                ['name' => 'إعداد التقرير', 'expected_days' => 7, 'phase' => 'handover'],
                ['name' => 'العرض والتسليم', 'expected_days' => 3, 'phase' => 'handover'],
            ],
        ],
    ];

    /** مفتاح القالب الافتراضي — أوّل القوالب. */
    public const DEFAULT_TEMPLATE_KEY = 'full_design';

    /**
     * كتالوج القوالب للواجهة: المفتاح والاسم والوصف وأسماء مراحله.
     *
     * @return array<int, array<string, mixed>>
     */
    public function templates(): array
    {
        return StageTemplate::with('stages')->orderBy('position')->orderBy('id')->get()
            ->map(fn (StageTemplate $t): array => [
                'id' => $t->id,
                'key' => $t->key,
                'label' => $t->label,
                'hint' => $t->hint,
                'is_system' => $t->is_system,
                'stages_count' => $t->stages->count(),
                'total_days' => (int) $t->stages->sum('expected_days'),
                // الأسماء وحدها لبطاقة الاختيار، والتفاصيل الكاملة لشاشة التحرير
                'stages' => $t->stages->pluck('name')->all(),
                'stage_rows' => $t->stages->map(fn (StageTemplateStage $s): array => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'expected_days' => $s->expected_days,
                    'phase' => $s->phase,
                ])->all(),
            ])->values()->all();
    }

    /**
     * توزيع المشاريع على المراحل العامّة (طلب أيمن 2026-09-09): كم مشروعًا يقف
     * الآن في كل مرحلة. يُحسب بتصنيف المرحلة الجارية لا باسمها، فيعمل مهما
     * اختلفت قوالب المشاريع وأسماء مراحلها.
     *
     * @return array<int, array{phase: string, label: string, color: string, count: int}>
     */
    /** خانة المراحل التي سمّاها المكتب بنفسه ولم يُصنّفها. */
    public const PHASE_OTHER = 'other';

    public function pipeline(): array
    {
        $counts = ProjectStage::query()
            ->where('project_stages.status', 'active')
            // المشاريع المحذوفة أو المنجَزة لا تُحسب في «أين نقف الآن»
            ->whereHas('project', fn ($q) => $q->whereNotIn('status', ['done', 'cancelled']))
            ->selectRaw('COALESCE(phase, ?) as phase, COUNT(DISTINCT project_id) as total', [self::PHASE_OTHER])
            ->groupBy('phase')
            ->pluck('total', 'phase');

        $cells = collect(ProjectStage::PHASES)
            ->map(fn (array $meta, string $key): array => [
                'phase' => $key,
                'label' => $meta['label'],
                'color' => $meta['color'],
                'count' => (int) ($counts[$key] ?? 0),
            ])
            ->values()->all();

        // مرحلةٌ سمّاها المكتب بنفسه ولم يُصنّفها: تظهر في «أخرى» ولا تسقط صامتةً
        // من البطاقة — فمشروعٌ بلا خانة يعني مشروعًا اختفى من نظر الإدارة.
        $other = (int) ($counts[self::PHASE_OTHER] ?? 0);
        if ($other > 0) {
            $cells[] = ['phase' => self::PHASE_OTHER, 'label' => 'مراحل خاصة', 'color' => '#64748B', 'count' => $other];
        }

        return $cells;
    }

    /**
     * يزرع قالب مراحل في المشروع — <b>بلا حذف ولا تكرار</b> (طلب أيمن 2026-08-31).
     *
     * مشروع بلا مراحل: يصير القالب مراحلَه وأولاها «جارية».
     * مشروع له مراحل: تُلحَق مراحل القالب الجديدة بعد آخر مرحلة بحالة «منتظرة»،
     * فتبقى المراحل القائمة ونقاشها وتواريخها كما هي — المكتب يضمّ مسارًا جديدًا
     * (إشرافًا مثلًا) إلى مسارٍ جارٍ.
     *
     * ومرحلةٌ اسمها موجود لا تُزرع ثانيةً: الضغط مرّتين على القالب نفسه لا
     * يُضاعف مراحله.
     *
     * @return int عدد المراحل المضافة فعلًا
     */
    public function seedDefaults(Project $project, ?string $template = null): int
    {
        // القالب من القاعدة — يملكه المكتب ويعدّله؛ وإن غاب المطلوب رجعنا للافتراضي ثم لأوّل قالب.
        $model = StageTemplate::with('stages')
            ->when($template !== null, fn ($q) => $q->where('key', $template))
            ->first()
            ?? StageTemplate::with('stages')->where('key', self::DEFAULT_TEMPLATE_KEY)->first()
            ?? StageTemplate::with('stages')->orderBy('position')->first();

        if ($model === null || $model->stages->isEmpty()) {
            return 0;
        }

        return DB::transaction(function () use ($project, $model): int {
            $existingNames = $project->stages()->pluck('name')
                ->map(fn (string $n): string => trim($n))->all();
            $fresh = $model->stages
                ->reject(fn (StageTemplateStage $s): bool => in_array(trim($s->name), $existingNames, true))
                ->map(fn (StageTemplateStage $s): array => [
                    'name' => $s->name,
                    'expected_days' => $s->expected_days,
                    'phase' => $s->phase,
                ])
                ->values()->all();

            $hadStages = $existingNames !== [];
            $offset = (int) ($project->stages()->max('position') ?? -1) + 1;

            foreach ($fresh as $i => $stage) {
                $project->stages()->create([
                    'name' => $stage['name'],
                    // التصنيف العامّ — به تُجمَع المشاريع في بطاقة «مراحل المشاريع»
                    'phase' => $stage['phase'] ?? null,
                    'expected_days' => $stage['expected_days'],
                    'position' => $offset + $i,
                    // أول مرحلة في مشروع فارغ تبدأ جارية؛ وما يُلحَق بمسارٍ قائم ينتظر دوره.
                    'status' => ! $hadStages && $i === 0 ? 'active' : 'pending',
                    'started_at' => ! $hadStages && $i === 0 ? now() : null,
                ]);
            }

            return count($fresh);
        });
    }

    /**
     * يضيف مرحلة جديدة. إن مُرّر after_stage_id (وينتمي للمشروع) تُدرَج المرحلة
     * مباشرةً بعده مع إزاحة ترتيب ما يليها؛ وإلا تُلحَق في نهاية المراحل.
     *
     * @param  array{name: string, expected_days?: int|null, after_stage_id?: int|null}  $data
     */
    public function add(Project $project, array $data): ProjectStage
    {
        return DB::transaction(function () use ($project, $data): ProjectStage {
            $after = null;
            if (! empty($data['after_stage_id'])) {
                $after = $project->stages()->whereKey($data['after_stage_id'])->first();
            }

            if ($after) {
                // إدراج بعد المرحلة المحدّدة: إزاحة كل ما ترتيبه أكبر منها لإفساح مكان.
                $newPosition = $after->position + 1;
                $project->stages()->where('position', '>=', $newPosition)->increment('position');
            } else {
                $newPosition = $project->stages()->exists() ? (int) $project->stages()->max('position') + 1 : 0;
            }

            return $project->stages()->create([
                'name' => $data['name'],
                'expected_days' => $data['expected_days'] ?? null,
                'position' => $newPosition,
                'status' => 'pending',
            ]);
        });
    }

    /**
     * يُفعّل مرحلة منتظرة (يجعلها «جارية») — يحلّ مأزق عدم وجود مرحلة جارية
     * (مثلًا بعد اكتمال كل المراحل ثم إضافة مرحلة). يفترض المستدعي عدم وجود مرحلة جارية أخرى.
     */
    public function activate(ProjectStage $stage): ProjectStage
    {
        $stage->status = 'active';
        $stage->started_at = $stage->started_at ?? now();
        $stage->completed_at = null;
        $stage->save();

        return $stage->refresh();
    }

    /**
     * @param  array{name?: string, expected_days?: int|null}  $data
     */
    public function update(ProjectStage $stage, array $data): ProjectStage
    {
        $stage->fill(array_intersect_key($data, array_flip(['name', 'expected_days'])));
        $stage->save();

        return $stage->refresh();
    }

    /**
     * يُنهي المرحلة الحالية ويُفعّل أول مرحلة منتظرة تليها — أكشن التقديم الإداري.
     */
    public function advance(ProjectStage $stage): ProjectStage
    {
        return DB::transaction(function () use ($stage): ProjectStage {
            $stage->status = 'done';
            $stage->completed_at = now();
            if ($stage->started_at) {
                $stage->actual_days = (int) $stage->started_at->diffInDays(now());
            }
            $stage->save();

            // تفعيل المرحلة التالية تلقائيًا فقط إن لم تتبقَّ مرحلة جارية أخرى — للحفاظ على
            // التدفّق الخطّي في المسار المعتاد، ودون مفاجآت في وضع التداخل (عدة مراحل جارية).
            $otherActive = $stage->project->stages()
                ->where('status', 'active')
                ->whereKeyNot($stage->id)
                ->exists();

            if (! $otherActive) {
                $next = $stage->project->stages()
                    ->where('status', 'pending')
                    ->where('position', '>', $stage->position)
                    ->orderBy('position')
                    ->first();

                if ($next) {
                    $next->update(['status' => 'active', 'started_at' => now()]);
                }
            }

            return $stage->refresh();
        });
    }

    public function delete(ProjectStage $stage): void
    {
        $stage->delete();
    }

    public function addComment(ProjectStage $stage, User $user, string $body): ProjectStageComment
    {
        return $stage->comments()->create([
            'user_id' => $user->id,
            'body' => $body,
        ]);
    }
}
