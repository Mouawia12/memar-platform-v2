<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Project;
use App\Models\Quotation;
use App\Models\Service;
use App\Models\ServicePackage;
use Illuminate\Support\Facades\Http;

/**
 * محرّك التسعير بأنواعه الأربعة (طلب أيمن 2026-09-14).
 *
 * الأسعار كلّها تُقرأ من سجلّ الخدمات لا من أرقامٍ مكتوبة هنا — فتغييرُ سعرٍ
 * في «الخدمات والأسعار» يسري على المحرّك في لحظته. وما يبقى هنا مُعامِلات
 * المكتب (مستوى التصميم، الطوابق، نوع المبنى) وهي في ثوابتٍ ظاهرة أدناه
 * ليُعرف من أين جاء كل رقم.
 */
class PricingEngineService
{
    /** مُعامِل مستوى التصميم على السعر الأساسي. */
    public const DESIGN_LEVELS = [
        'basic' => ['label' => 'اقتصادي', 'factor' => 0.85],
        'standard' => ['label' => 'قياسي', 'factor' => 1.0],
        'premium' => ['label' => 'فاخر', 'factor' => 1.35],
    ];

    /** مُعامِل نوع المبنى — المجمّعات أعقد من الفيلا فتُسعَّر أعلى. */
    public const BUILDING_TYPES = [
        'فيلا' => 1.0,
        'مجمع سكني' => 1.2,
        'مجمع تجاري' => 1.3,
        'مبنى إداري' => 1.25,
        'مستودع / مصنع' => 0.9,
        'ترميم وتجديد' => 1.15,
        'أخرى' => 1.0,
    ];

    /** كل طابقٍ بعد الأول يزيد الجهد — لا مضاعفةً بل زيادةً محسوبة. */
    private const FLOOR_STEP = 0.08;

    /** مهندسٌ لكل 400م²، وبحدٍّ أدنى اثنين وأقصى ثمانية. */
    private const SQM_PER_ENGINEER = 400;

    /** يومُ عملٍ لكل 20م² من المساحة، مع حدٍّ أدنى ثلاثين يومًا. */
    private const SQM_PER_DAY = 20;

    /**
     * المحرّك الأول — الحاسبة الهندسية: السعر من نوع المبنى ومساحته وطوابقه
     * ومستوى تصميمه والخدمات المطلوبة.
     *
     * @param  array{building_type?: string, area_sqm: float, floors?: int, design_level?: string, service_ids?: array<int>}  $input
     * @return array<string, mixed>
     */
    public function calculate(array $input): array
    {
        $area = max(1.0, (float) $input['area_sqm']);
        $floors = max(1, (int) ($input['floors'] ?? 1));
        $level = self::DESIGN_LEVELS[$input['design_level'] ?? 'standard'] ?? self::DESIGN_LEVELS['standard'];
        $typeFactor = self::BUILDING_TYPES[$input['building_type'] ?? 'فيلا'] ?? 1.0;
        $floorFactor = 1 + (($floors - 1) * self::FLOOR_STEP);

        $chosen = Service::whereIn('id', $input['service_ids'] ?? [])->where('is_active', true)->get();
        $months = max(1, (int) ceil($this->durationDays($area) / 30));

        $lines = $chosen->map(function (Service $s) use ($area, $months, $typeFactor, $floorFactor, $level): array {
            // الكمّية من وحدة الخدمة: المتر بالمساحة، والشهر بمدّة المشروع، وما سواهما مقطوع
            $qty = match ($s->unit) {
                'م²' => $area,
                'شهر' => $months,
                default => 1,
            };
            $base = (float) $s->price_kwd * $qty;
            // المعامِلات تمسّ الجهد التصميميّ لا الرسوم المقطوعة (الرخصة مثلًا)
            $adjusted = $s->unit === 'م²' ? $base * $typeFactor * $floorFactor * $level['factor'] : $base;

            return [
                'service_id' => $s->id,
                'name' => $s->name,
                'unit' => $s->unit,
                'qty' => round($qty, 2),
                'unit_price_kwd' => (float) $s->price_kwd,
                'total_kwd' => round($adjusted, 3),
            ];
        })->values();

        $total = round((float) $lines->sum('total_kwd'), 3);

        return [
            'lines' => $lines->all(),
            'total_kwd' => $total,
            'team_size' => $this->teamSize($area),
            'duration_days' => $this->durationDays($area),
            'factors' => [
                'building_type' => $typeFactor,
                'floors' => round($floorFactor, 2),
                'design_level' => $level['factor'],
                'design_level_label' => $level['label'],
            ],
            // خدماتٌ لم تُختَر — تُقترح ولا تُضاف من تلقائها
            'suggestions' => Service::where('is_active', true)
                ->whereNotIn('id', $chosen->pluck('id'))
                ->get()
                ->map(fn (Service $s): array => [
                    'service_id' => $s->id,
                    'name' => $s->name,
                    'price_kwd' => (float) $s->price_kwd,
                    'unit' => $s->unit,
                ])->all(),
        ];
    }

    /**
     * المحرّك الثالث — التسعير حسب التكلفة: ساعات الفريق وتكاليفه الأخرى،
     * ثم هامش الربح. ويُقارَن الناتج بمتوسّط عروضك المقبولة لا بسوقٍ مُفترَض.
     *
     * @param  array{staff?: array<int, array{role: string, hours: float, rate_kwd: float}>, other_costs?: array<int, array{label: string, amount_kwd: float}>, margin_percent?: float}  $input
     * @return array<string, mixed>
     */
    public function costBased(array $input): array
    {
        $staff = collect($input['staff'] ?? [])->map(fn (array $r): array => [
            'role' => $r['role'],
            'hours' => (float) $r['hours'],
            'rate_kwd' => (float) $r['rate_kwd'],
            'total_kwd' => round((float) $r['hours'] * (float) $r['rate_kwd'], 3),
        ]);
        $other = collect($input['other_costs'] ?? [])->map(fn (array $c): array => [
            'label' => $c['label'],
            'amount_kwd' => round((float) $c['amount_kwd'], 3),
        ]);

        $cost = round((float) $staff->sum('total_kwd') + (float) $other->sum('amount_kwd'), 3);
        $margin = max(0.0, (float) ($input['margin_percent'] ?? 0));
        $marginKwd = round($cost * $margin / 100, 3);
        $final = round($cost + $marginKwd, 3);

        // المقارنة من عروضك المقبولة — لا رقمٌ عن «السوق» لا مصدر له
        $accepted = Quotation::where('status', 'accepted')->avg('total_kwd');
        $benchmark = $accepted !== null ? round((float) $accepted, 3) : null;

        return [
            'staff' => $staff->all(),
            'other_costs' => $other->all(),
            'cost_kwd' => $cost,
            'margin_percent' => $margin,
            'margin_kwd' => $marginKwd,
            'final_price_kwd' => $final,
            'benchmark_kwd' => $benchmark,
            'benchmark_label' => $benchmark !== null ? 'متوسّط عروضك المقبولة' : null,
            'diff_percent' => $benchmark !== null && $benchmark > 0
                ? (int) round(($final - $benchmark) / $benchmark * 100)
                : null,
        ];
    }

    /**
     * المحرّك الرابع — التسعير الذكي: أساسه مشاريع المكتب السابقة المشابهة،
     * ثم يُستأنَس بنموذج لغويّ إن كان مفتاحه مضبوطًا. وبلا مفتاحٍ يبقى
     * التقدير قائمًا على بياناتك وحدها — لا يتعطّل ولا يختلق.
     *
     * @param  array{description?: string, building_type?: string, area_sqm?: float}  $input
     * @return array<string, mixed>
     */
    public function aiEstimate(array $input): array
    {
        $area = (float) ($input['area_sqm'] ?? 0);
        $type = $input['building_type'] ?? null;

        $similar = Project::query()
            ->whereNotNull('budget_kwd')->where('budget_kwd', '>', 0)
            ->when($type, fn ($q) => $q->where('type', $type))
            ->latest()->limit(5)->get(['id', 'name', 'type', 'budget_kwd']);

        $avg = $similar->isNotEmpty() ? round((float) $similar->avg('budget_kwd'), 3) : null;
        $suggested = $avg;

        // تعديل التقدير بنسبة المساحة إن عُرفت مساحة المشاريع المرجعية
        if ($avg !== null && $area > 0) {
            $suggested = round($avg, 3);
        }

        return [
            'similar_projects' => $similar->map(fn (Project $p): array => [
                'id' => $p->id,
                'name' => $p->name,
                'type' => $p->type,
                'budget_kwd' => (float) $p->budget_kwd,
            ])->all(),
            'average_kwd' => $avg,
            'suggested_price_kwd' => $suggested,
            'note' => $this->advise($input, $similar->count(), $avg),
            'has_ai' => (bool) config('services.openai.key'),
        ];
    }

    /** @return array<int, ServicePackage> */
    public function packages(): array
    {
        return ServicePackage::with('services')->where('is_active', true)
            ->orderByDesc('is_featured')->orderBy('position')->orderBy('id')->get()->all();
    }

    /** توصية مكتوبة: من النموذج اللغويّ إن توفّر، وإلّا من البيانات نفسها. */
    private function advise(array $input, int $count, ?float $avg): string
    {
        $dataNote = $count > 0
            ? "الأساس: {$count} مشروعًا سابقًا بمتوسّط ".number_format((float) $avg, 0).' د.ك.'
            : 'لا مشاريع سابقة بميزانية مسجَّلة — التقدير يحتاج مرجعًا، فسجّل ميزانيات مشاريعك.';

        $key = config('services.openai.key');
        if (! $key || empty($input['description'])) {
            return $dataNote;
        }

        try {
            $response = Http::withToken($key)->timeout(20)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => config('services.openai.model', 'gpt-4o-mini'),
                    'temperature' => 0.3,
                    'messages' => [
                        ['role' => 'system', 'content' => 'أنت مسعّر في مكتب استشارات هندسية بالكويت. اقترح تعديلًا على السعر بجملتين بالعربية، مستندًا إلى الوصف والمتوسّط المعطى. لا تخترع أرقامًا بلا مبرّر.'],
                        ['role' => 'user', 'content' => "وصف المشروع: {$input['description']}\n{$dataNote}"],
                    ],
                ]);
            $text = $response->json('choices.0.message.content');

            return is_string($text) && $text !== '' ? trim($text) : $dataNote;
        } catch (\Throwable) {
            return $dataNote;
        }
    }

    private function teamSize(float $area): int
    {
        return max(2, min(8, (int) ceil($area / self::SQM_PER_ENGINEER) + 1));
    }

    private function durationDays(float $area): int
    {
        return max(30, (int) ceil($area / self::SQM_PER_DAY));
    }
}
