<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Employee;
use App\Models\PointRedemptionRequest;
use App\Models\Salary;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * استبدال نقاط الموظف بالراتب عبر موافقة الإدارة (المرحلة 6):
 *  - الطلب: يتحقّق من الحدّ الأدنى والرصيد المتاح (ناقص المحجوز في طلبات معلّقة)، بلا خصم.
 *  - الاعتماد: يخصم النقاط ويقيّد القيمة في كشف رواتب الشهر الجاري (بدل allowances).
 *  - الرفض: لا أثر على الرصيد، ويحرّر المحجوز.
 */
class PointRedemptionService
{
    public function __construct(private readonly LoyaltyService $loyalty) {}

    private function rate(): int
    {
        return max(1, (int) config('loyalty.salary.points_per_kwd', 50));
    }

    /** المتاح للاستبدال = الرصيد المتاح ناقص المحجوز في طلبات معلّقة. */
    public function availableForRedemption(User $user): int
    {
        $pending = (int) PointRedemptionRequest::where('user_id', $user->id)
            ->where('status', PointRedemptionRequest::STATUS_PENDING)->sum('points');

        return $this->loyalty->userAvailableBalance($user) - $pending;
    }

    /**
     * إنشاء طلب استبدال (بلا خصم). يحوّل مضاعفات المعدّل فقط كي لا تضيع كسور النقاط.
     *
     * @throws RuntimeException تحت الحدّ الأدنى أو عند نقص المتاح
     */
    public function request(User $user, int $points): PointRedemptionRequest
    {
        $rate = $this->rate();
        $min = (int) config('loyalty.salary.min_points', 50);

        $convertible = intdiv($points, $rate) * $rate;
        if ($convertible < $min) {
            throw new RuntimeException("أقل استبدال {$min} نقطة.");
        }
        if ($convertible > $this->availableForRedemption($user)) {
            throw new RuntimeException('النقاط المتاحة غير كافية (بعد خصم الطلبات المعلّقة).');
        }

        return PointRedemptionRequest::create([
            'user_id' => $user->id,
            'points' => $convertible,
            'amount_kwd' => round($convertible / $rate, 3),
            'status' => PointRedemptionRequest::STATUS_PENDING,
        ]);
    }

    /**
     * اعتماد الطلب: يخصم النقاط ويضيف القيمة لكشف رواتب الشهر الجاري للموظف.
     *
     * @throws RuntimeException إن لم يكن الطلب معلّقًا أو نقص الرصيد
     */
    public function approve(PointRedemptionRequest $req, int $approverId): PointRedemptionRequest
    {
        if ($req->status !== PointRedemptionRequest::STATUS_PENDING) {
            throw new RuntimeException('الطلب ليس قيد الانتظار.');
        }

        return DB::transaction(function () use ($req, $approverId): PointRedemptionRequest {
            $user = $req->user;
            if ($this->loyalty->userAvailableBalance($user) < $req->points) {
                throw new RuntimeException('رصيد النقاط المتاح غير كافٍ للاعتماد.');
            }

            // خصم النقاط (حركة سالبة متاحة).
            $this->loyalty->redeemUserPoints($user, $req->points, "استبدال {$req->points} نقطة براتب — طلب #{$req->id}", $req);

            // قيد في كشف رواتب الشهر الجاري (allowances) إن وُجد سجل موظف.
            $salaryId = $this->postToPayroll($user, (float) $req->amount_kwd, $req->points);

            $req->forceFill([
                'status' => PointRedemptionRequest::STATUS_APPROVED,
                'approved_by' => $approverId,
                'approved_at' => now(),
                'salary_id' => $salaryId,
            ])->save();

            return $req;
        });
    }

    public function reject(PointRedemptionRequest $req, int $approverId, ?string $reason): PointRedemptionRequest
    {
        if ($req->status !== PointRedemptionRequest::STATUS_PENDING) {
            throw new RuntimeException('الطلب ليس قيد الانتظار.');
        }

        $req->forceFill([
            'status' => PointRedemptionRequest::STATUS_REJECTED,
            'approved_by' => $approverId,
            'approved_at' => now(),
            'notes' => $reason,
        ])->save();

        return $req;
    }

    /** يضيف قيمة المكافأة لبند allowances في راتب الشهر الجاري. يعيد معرّف الراتب أو null. */
    private function postToPayroll(User $user, float $amount, int $points): ?int
    {
        $employee = Employee::where('user_id', $user->id)->first();
        if (! $employee) {
            return null; // لا سجل موظف HR مرتبط — يُعتمد الطلب بلا قيد راتب (يُدار يدويًا)
        }

        $month = now()->format('Y-m');
        $salary = Salary::firstOrNew(['employee_id' => $employee->id, 'month' => $month]);
        if (! $salary->exists) {
            $salary->base_kwd = (float) ($employee->base_salary_kwd ?? 0);
            $salary->deductions_kwd = 0;
            $salary->status = 'draft';
        }
        $salary->allowances_kwd = (float) $salary->allowances_kwd + $amount;
        $salary->net_kwd = (float) $salary->base_kwd + (float) $salary->allowances_kwd - (float) $salary->deductions_kwd;
        $salary->notes = trim(((string) $salary->notes ? $salary->notes."\n" : '')
            .'مكافأة نقاط ولاء: +'.number_format($amount, 3)." د.ك ({$points} نقطة)");
        $salary->save();

        return $salary->id;
    }
}
