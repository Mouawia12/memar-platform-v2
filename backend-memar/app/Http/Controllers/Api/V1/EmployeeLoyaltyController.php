<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\Contact;
use App\Models\LoyaltyTransaction;
use App\Models\PointRedemptionRequest;
use App\Models\User;
use App\Services\LoyaltyService;
use App\Services\PointRedemptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * محفظة نقاط الموظف واقتصادها (اجتماع 2026-08-07):
 * الموظف يكسب نقاطًا عند فوز فرصته بالتعاقد، ويحوّلها إلى رصيد راتب (50 نقطة = 1 د.ك).
 */
class EmployeeLoyaltyController extends ApiController
{
    public function __construct(
        private readonly LoyaltyService $loyalty,
        private readonly PointRedemptionService $redemption,
    ) {}

    /** محفظة نقاط الموظف الحالي — رصيد + قابل للتحويل + كود إحالة + سجل. */
    public function points(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $rate = (int) config('loyalty.salary.points_per_kwd', 50);
        // الرصيد المعروض = المتاح فعليًا للتحويل (المعلّقة/المستحقة تنتظر اعتماد الإدارة).
        $balance = $this->loyalty->userAvailableBalance($user);

        // كود إحالة ثابت للموظف — يُولَّد مرة واحدة إن لم يوجد.
        if (empty($user->referral_code)) {
            $user->forceFill(['referral_code' => 'EMP-' . $user->id . '-' . strtoupper(Str::random(4))])->save();
        }

        $dealsWon = LoyaltyTransaction::where('user_id', $user->id)->where('source', 'referral_contracted')->count();
        $pending = Contact::where('owner_id', $user->id)->whereNull('converted_project_id')->count();

        $transactions = LoyaltyTransaction::where('user_id', $user->id)
            ->latest()->limit(20)->get()
            ->map(fn (LoyaltyTransaction $t): array => [
                'id' => $t->id,
                'points' => $t->points,
                'balance_after' => $t->balance_after,
                'source' => $t->source,
                'description' => $t->description,
                'created_at' => $t->created_at?->toIso8601String(),
            ]);

        return $this->ok([
            'code' => $user->referral_code,
            'balance' => $balance,
            // تفصيل دورة حياة النقاط (المرحلة 2): معلّقة/مستحقة/متاحة/مستبدلة.
            'by_status' => $this->loyalty->userPointsByStatus($user),
            'lifetime' => $this->loyalty->userLifetime($user),
            'rate_points_per_kwd' => $rate,
            'convertible_kwd' => intdiv($balance, $rate), // د.ك متاحة للتحويل الآن (مضاعفات السعر فقط)
            'min_points' => (int) config('loyalty.salary.min_points', 50),
            'points_per_deal' => (int) config('loyalty.earn.referral_contracted', 500),
            'deals_won' => $dealsWon,
            'pending_count' => $pending,
            'available_for_redemption' => $this->redemption->availableForRedemption($user),
            // طلبات الاستبدال الأخيرة (بحالتها) — ليتابعها الموظف.
            'redemptions' => PointRedemptionRequest::where('user_id', $user->id)->latest()->limit(10)->get()
                ->map(fn (PointRedemptionRequest $r): array => [
                    'id' => $r->id, 'points' => $r->points, 'amount_kwd' => $r->amount_kwd,
                    'status' => $r->status, 'created_at' => $r->created_at?->toIso8601String(),
                ]),
            'transactions' => $transactions,
        ]);
    }

    /**
     * طلب استبدال نقاط بالراتب (المرحلة 6) — يُنشئ طلبًا بانتظار اعتماد الإدارة، بلا خصم فوري.
     * (نفس المسار القديم /points/convert؛ صار طلبًا خاضعًا للموافقة بدل تحويل تلقائي.)
     */
    public function convert(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validate(['points' => ['required', 'integer', 'min:1']]);

        try {
            $req = $this->redemption->request($user, (int) $data['points']);
        } catch (RuntimeException $e) {
            return $this->fail($e->getMessage(), 422);
        }

        return $this->created(
            ['id' => $req->id, 'points' => $req->points, 'amount_kwd' => $req->amount_kwd, 'status' => $req->status],
            'تم إرسال طلب استبدال ' . $req->points . ' نقطة (' . number_format((float) $req->amount_kwd, 3) . ' د.ك) — بانتظار اعتماد الإدارة.',
        );
    }
}
