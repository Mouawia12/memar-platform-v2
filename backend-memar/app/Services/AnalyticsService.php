<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Attendance;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\QuotationItem;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * تحليلات التقارير: سلاسل شهرية وتوزيعات — من بيانات النظام الحقيقية،
 * بنفس محاور تقارير معمار القديمة (إيرادات/مصروفات، حالة المشاريع، الحضور، الخدمات).
 */
class AnalyticsService
{
    /** المدد المتاحة وعدد أشهر كلٍّ منها. */
    public const PERIODS = [
        'month' => 1,
        'quarter' => 3,
        'year' => 12,
    ];

    /** أسماء الأشهر عربيةً — ثابتة، فلا تعتمد التسميات على ضبط اللغة أو توفّر intl. */
    private const MONTH_NAMES = [
        1 => 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
    ];

    /**
     * @return array<string, mixed>
     */
    public function build(string $period): array
    {
        $months = self::PERIODS[$period] ?? self::PERIODS['quarter'];
        $from = CarbonImmutable::now()->startOfMonth()->subMonths($months - 1);

        $series = $this->monthlySeries($from, $months);
        $revenue = array_sum($series['revenue']);
        $expenses = array_sum($series['expenses']);
        $attendanceAvg = $this->average(array_filter($series['attendance'], fn ($v) => $v !== null));

        return [
            'period' => $period,
            'from' => $from->toDateString(),
            'to' => CarbonImmutable::now()->endOfMonth()->toDateString(),
            'totals' => [
                'revenue' => round($revenue, 3),
                'expenses' => round($expenses, 3),
                'net' => round($revenue - $expenses, 3),
                'margin_pct' => $revenue > 0 ? (int) round((($revenue - $expenses) / $revenue) * 100) : 0,
                'attendance_pct' => $attendanceAvg === null ? null : (int) round($attendanceAvg),
            ],
            'series' => $series,
            'projects_by_status' => $this->projectsByStatus(),
            'services' => $this->servicesDistribution(),
        ];
    }

    /**
     * إيرادات ومصروفات ونسبة حضور لكل شهر ضمن المدة.
     *
     * @return array{labels: array<int, string>, revenue: array<int, float>, expenses: array<int, float>, attendance: array<int, int|null>}
     */
    private function monthlySeries(CarbonImmutable $from, int $months): array
    {
        // تجميع مرّة واحدة لكل مصدر ثم توزيعه على الأشهر — بدل استعلام لكل شهر
        $revenue = $this->sumByMonth(
            Invoice::query()->whereNotIn('status', ['draft', 'cancelled'])->whereNotNull('issue_date'),
            'issue_date',
            'total_kwd',
            $from
        );
        $expenses = $this->sumByMonth(Expense::query(), 'spent_at', 'amount_kwd', $from);
        $attendance = $this->attendanceByMonth($from);

        // تُذكر السنة في التسمية فقط إن امتدّت المدة على أكثر من سنة ميلادية
        $spansYears = $from->year !== $from->addMonths($months - 1)->year;

        $labels = [];
        $rev = [];
        $exp = [];
        $att = [];

        for ($i = 0; $i < $months; $i++) {
            $month = $from->addMonths($i);
            $key = $month->format('Y-m');

            $labels[] = self::MONTH_NAMES[$month->month].($spansYears ? ' '.$month->year : '');
            $rev[] = round((float) ($revenue[$key] ?? 0), 3);
            $exp[] = round((float) ($expenses[$key] ?? 0), 3);
            $att[] = $attendance[$key] ?? null;
        }

        return ['labels' => $labels, 'revenue' => $rev, 'expenses' => $exp, 'attendance' => $att];
    }

    /**
     * مجموع عمود مبلغ مجمّعًا بالشهر (Y-m).
     *
     * @param  Builder<covariant \Illuminate\Database\Eloquent\Model>  $query
     * @return array<string, float>
     */
    private function sumByMonth($query, string $dateColumn, string $amountColumn, CarbonImmutable $from): array
    {
        return $query
            ->whereDate($dateColumn, '>=', $from->toDateString())
            ->selectRaw("DATE_FORMAT({$dateColumn}, '%Y-%m') as ym, SUM({$amountColumn}) as total")
            ->groupBy('ym')
            ->pluck('total', 'ym')
            ->map(fn ($v) => (float) $v)
            ->all();
    }

    /**
     * نسبة الحضور لكل شهر = (حاضر + متأخر) ÷ كل السجلات.
     *
     * @return array<string, int>
     */
    private function attendanceByMonth(CarbonImmutable $from): array
    {
        return Attendance::query()
            ->whereDate('date', '>=', $from->toDateString())
            ->selectRaw("DATE_FORMAT(date, '%Y-%m') as ym, COUNT(*) as total, SUM(status IN ('present','late')) as attended")
            ->groupBy('ym')
            ->get()
            ->mapWithKeys(fn ($r) => [
                (string) $r->ym => (int) $r->total > 0 ? (int) round(((int) $r->attended / (int) $r->total) * 100) : 0,
            ])
            ->all();
    }

    /**
     * @return array<int, array{status: string, count: int}>
     */
    private function projectsByStatus(): array
    {
        return Project::query()
            ->selectRaw('status, COUNT(*) as c')
            ->groupBy('status')
            ->get()
            ->map(fn ($r) => ['status' => (string) $r->status, 'count' => (int) $r->c])
            ->all();
    }

    /**
     * أكثر الخدمات تحقيقًا للقيمة — من بنود عروض الأسعار.
     *
     * @return array<int, array{name: string, value: float}>
     */
    private function servicesDistribution(): array
    {
        return QuotationItem::query()
            ->join('services', 'services.id', '=', 'quotation_items.service_id')
            ->selectRaw('services.name as name, SUM(quotation_items.total_kwd) as v')
            ->groupBy('services.name')
            ->orderByDesc(DB::raw('SUM(quotation_items.total_kwd)'))
            ->limit(6)
            ->get()
            ->map(fn ($r) => ['name' => (string) $r->name, 'value' => round((float) $r->v, 3)])
            ->all();
    }

    /**
     * @param  array<int, int|null>  $values
     */
    private function average(array $values): ?float
    {
        return $values === [] ? null : array_sum($values) / count($values);
    }
}
