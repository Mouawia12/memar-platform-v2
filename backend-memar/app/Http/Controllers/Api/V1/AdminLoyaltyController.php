<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\LoyaltyTransaction;
use App\Models\PointRedemptionRequest;
use App\Models\User;
use App\Services\LoyaltyService;
use App\Services\PointRedemptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * إدارة نقاط الموظفين (loyalty.manage): منح/خصم يدوي + اعتماد المستحقة + إلغاء.
 * الموظف لا يستطيع تعديل رصيده — كل تعديل يمرّ من هنا ويُسجَّل في حركة موثّقة.
 */
class AdminLoyaltyController extends ApiController
{
    public function __construct(
        private readonly LoyaltyService $loyalty,
        private readonly PointRedemptionService $redemption,
    ) {}

    /** طلبات الاستبدال (افتراضيًا المعلّقة) — للإدارة. */
    public function redemptions(Request $request): JsonResponse
    {
        $status = $request->string('status')->toString() ?: 'pending';

        return $this->ok(
            PointRedemptionRequest::with(['user:id,name', 'approver:id,name'])
                ->when($status !== 'all', fn ($q) => $q->where('status', $status))
                ->latest()->limit(200)->get()
                ->map(fn (PointRedemptionRequest $r): array => [
                    'id' => $r->id,
                    'user' => $r->user?->name,
                    'points' => $r->points,
                    'amount_kwd' => $r->amount_kwd,
                    'status' => $r->status,
                    'approver' => $r->approver?->name,
                    'salary_id' => $r->salary_id,
                    'notes' => $r->notes,
                    'created_at' => $r->created_at?->toIso8601String(),
                ]),
        );
    }

    /** اعتماد طلب استبدال → خصم النقاط وقيدها في كشف الرواتب. */
    public function approveRedemption(Request $request, PointRedemptionRequest $redemptionRequest): JsonResponse
    {
        try {
            $req = $this->redemption->approve($redemptionRequest, (int) $request->user()->id);
        } catch (RuntimeException $e) {
            return $this->fail($e->getMessage(), 422);
        }

        return $this->ok(['id' => $req->id, 'status' => $req->status, 'salary_id' => $req->salary_id], 'تم اعتماد الاستبدال وقيده في الراتب');
    }

    /** رفض طلب استبدال (بلا أثر على الرصيد). */
    public function rejectRedemption(Request $request, PointRedemptionRequest $redemptionRequest): JsonResponse
    {
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:255']]);

        try {
            $req = $this->redemption->reject($redemptionRequest, (int) $request->user()->id, $data['reason'] ?? null);
        } catch (RuntimeException $e) {
            return $this->fail($e->getMessage(), 422);
        }

        return $this->ok(['id' => $req->id, 'status' => $req->status], 'تم رفض الطلب');
    }

    /** محفظة موظف بعينه: التفصيل حسب الحالة + آخر الحركات (للإدارة). */
    public function wallet(User $user): JsonResponse
    {
        return $this->ok([
            'user' => ['id' => $user->id, 'name' => $user->name],
            'balance' => $this->loyalty->userAvailableBalance($user),
            'lifetime' => $this->loyalty->userLifetime($user),
            'by_status' => $this->loyalty->userPointsByStatus($user),
            'transactions' => LoyaltyTransaction::where('user_id', $user->id)->latest()->limit(50)->get(),
        ]);
    }

    /** منح/خصم يدوي بنقاط لموظف (points موجب=منح، سالب=خصم) بحالة محدّدة. */
    public function award(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'points' => ['required', 'integer', 'not_in:0'],
            'description' => ['required', 'string', 'max:255'],
            'status' => ['sometimes', 'in:pending,earned,available'],
        ]);

        $points = (int) $data['points'];
        if ($points < 0) {
            // خصم يدوي: يُكتب مباشرةً كحركة سالبة متاحة.
            $balance = $this->loyalty->userBalance($user) + $points;
            $tx = LoyaltyTransaction::create([
                'user_id' => $user->id, 'contact_id' => null, 'points' => $points,
                'balance_after' => $balance, 'source' => 'adjust', 'status' => LoyaltyTransaction::STATUS_AVAILABLE,
                'description' => $data['description'],
            ]);

            return $this->created($tx, 'تم خصم النقاط');
        }

        $tx = $this->loyalty->awardUser(
            $user, $points, 'adjust', null, $data['description'],
            $data['status'] ?? LoyaltyTransaction::STATUS_AVAILABLE,
        );

        return $this->created($tx, 'تم منح النقاط');
    }

    /** اعتماد نقاط مستحقة → متاحة. */
    public function approve(LoyaltyTransaction $transaction): JsonResponse
    {
        try {
            $tx = $this->loyalty->approveUserTransaction($transaction);
        } catch (RuntimeException $e) {
            return $this->fail($e->getMessage(), 422);
        }

        return $this->ok($tx, 'تم اعتماد النقاط');
    }

    /** إلغاء نقاط (لا تُحتسب بعدها). */
    public function cancel(LoyaltyTransaction $transaction): JsonResponse
    {
        try {
            $tx = $this->loyalty->cancelUserTransaction($transaction);
        } catch (RuntimeException $e) {
            return $this->fail($e->getMessage(), 422);
        }

        return $this->ok($tx, 'تم إلغاء النقاط');
    }
}
