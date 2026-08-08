<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\LeaveRequest;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * إجازات الموظف — خدمة ذاتية (اجتماع 2026-08-07، بند 12): رصيد + تقديم طلب + متابعة.
 */
class LeaveController extends ApiController
{
    private const TYPE_LABEL = ['annual' => 'سنوية', 'sick' => 'مرضية', 'unpaid' => 'بدون راتب'];
    private const STATUS_LABEL = ['pending' => 'بانتظار الموافقة', 'approved' => 'موافق عليها', 'rejected' => 'مرفوضة'];

    /** طلبات إجازة الموظف الحالي. */
    public function mine(Request $request): JsonResponse
    {
        $leaves = LeaveRequest::where('user_id', $request->user()->id)->latest()->get()
            ->map(fn (LeaveRequest $l): array => [
                'id' => $l->id,
                'type' => $l->type,
                'type_label' => self::TYPE_LABEL[$l->type] ?? $l->type,
                'from_date' => $l->from_date?->toDateString(),
                'to_date' => $l->to_date?->toDateString(),
                'days' => $l->days,
                'reason' => $l->reason,
                'status' => $l->status,
                'status_label' => self::STATUS_LABEL[$l->status] ?? $l->status,
            ]);

        return $this->ok($leaves);
    }

    /** رصيد إجازات الموظف الحالي (سنوي/مرضي: الرصيد والمستخدَم والمتبقي). */
    public function balance(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $annual = (int) config('hr.leave.annual', 30);
        $sick = (int) config('hr.leave.sick', 15);

        $annualUsed = (int) LeaveRequest::where('user_id', $userId)->where('type', 'annual')->where('status', 'approved')->sum('days');
        $sickUsed = (int) LeaveRequest::where('user_id', $userId)->where('type', 'sick')->where('status', 'approved')->sum('days');

        return $this->ok([
            'annual_entitlement' => $annual,
            'annual_used' => $annualUsed,
            'annual_remaining' => max(0, $annual - $annualUsed),
            'sick_entitlement' => $sick,
            'sick_used' => $sickUsed,
            'sick_remaining' => max(0, $sick - $sickUsed),
        ]);
    }

    /** تقديم طلب إجازة جديد (يبدأ «بانتظار الموافقة»). */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['annual', 'sick', 'unpaid'])],
            'from_date' => ['required', 'date'],
            'to_date' => ['required', 'date', 'after_or_equal:from_date'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $days = (int) Carbon::parse($data['from_date'])->diffInDays(Carbon::parse($data['to_date'])) + 1;

        $leave = LeaveRequest::create([
            'user_id' => $request->user()->id,
            'type' => $data['type'],
            'from_date' => $data['from_date'],
            'to_date' => $data['to_date'],
            'days' => $days,
            'reason' => $data['reason'] ?? null,
            'status' => 'pending',
        ]);

        return $this->created(['id' => $leave->id, 'days' => $days], 'تم إرسال طلب الإجازة');
    }
}
