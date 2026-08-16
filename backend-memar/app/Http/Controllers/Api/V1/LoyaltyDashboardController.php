<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\Contact;
use App\Models\LeadReminder;
use App\Models\LoyaltyTransaction;
use App\Models\PointRedemptionRequest;
use App\Models\PipelineStage;
use App\Models\User;
use Illuminate\Http\JsonResponse;

/**
 * مجمّع لوحة إدارة Leads & Loyalty (المرحلة 7): مؤشرات الفرص + النقاط + المالية +
 * ترتيب الموظفين + قوائم الاعتماد المعلّقة (نقاط مستحقة + طلبات استبدال). للقراءة فقط.
 */
class LoyaltyDashboardController extends ApiController
{
    public function stats(): JsonResponse
    {
        $lostKeys = PipelineStage::where('is_lost', true)->pluck('key');
        $leads = fn () => Contact::where('type', 'lead');

        // مؤشّرات المتابعة عبر التذكيرات (فرص مميّزة لا مكرّرة).
        $overdue = LeadReminder::where('done', false)->where('remind_at', '<', now()->startOfDay())
            ->distinct()->count('contact_id');
        $dueToday = LeadReminder::where('done', false)->whereBetween('remind_at', [now()->startOfDay(), now()->endOfDay()])
            ->distinct()->count('contact_id');

        $leadStats = [
            'total' => (clone $leads())->count(),
            'active' => (clone $leads())->whereNull('converted_project_id')->whereNotIn('stage', $lostKeys)->count(),
            'urgent' => (clone $leads())->where('is_urgent', true)->count(),
            'vip' => (clone $leads())->where('is_vip', true)->count(),
            'won' => (clone $leads())->whereNotNull('converted_project_id')->count(),
            'lost' => (clone $leads())->whereIn('stage', $lostKeys)->count(),
            'due_today' => $dueToday,
            'overdue' => $overdue,
        ];

        $userTx = fn () => LoyaltyTransaction::whereNotNull('user_id');
        $pointStats = [
            'earned_pending' => (int) (clone $userTx())->where('status', 'earned')->sum('points'),
            'available_total' => (int) (clone $userTx())->where('status', 'available')->sum('points'),
            'redeemed_total' => (int) abs((int) (clone $userTx())->where('points', '<', 0)->sum('points')),
        ];

        $financial = [
            'discounts_given_kwd' => (float) Contact::sum('welcome_discount_kwd'),
            'referral_project_value_kwd' => (float) Contact::whereNotNull('referred_by_user_id')->whereNotNull('converted_project_id')->sum('deal_value_kwd'),
            'pending_redemption_kwd' => (float) PointRedemptionRequest::where('status', 'pending')->sum('amount_kwd'),
            'rewards_paid_kwd' => (float) PointRedemptionRequest::where('status', 'approved')->sum('amount_kwd'),
        ];

        // ترتيب الموظفين حسب النقاط مدى الحياة.
        $agg = LoyaltyTransaction::whereNotNull('user_id')
            ->selectRaw('user_id, SUM(CASE WHEN points > 0 THEN points ELSE 0 END) as lifetime')
            ->groupBy('user_id')->orderByDesc('lifetime')->limit(10)->get();
        $ids = $agg->pluck('user_id');
        $names = User::whereIn('id', $ids)->pluck('name', 'id');
        $avail = LoyaltyTransaction::whereIn('user_id', $ids)->where('status', 'available')
            ->selectRaw('user_id, SUM(points) s')->groupBy('user_id')->pluck('s', 'user_id');
        $referrals = Contact::whereIn('referred_by_user_id', $ids)
            ->selectRaw('referred_by_user_id, COUNT(*) c')->groupBy('referred_by_user_id')->pluck('c', 'referred_by_user_id');
        $contracts = Contact::whereIn('owner_id', $ids)->whereNotNull('converted_project_id')
            ->selectRaw('owner_id, COUNT(*) c')->groupBy('owner_id')->pluck('c', 'owner_id');

        $ranking = $agg->map(fn ($r): array => [
            'user_id' => $r->user_id,
            'name' => $names[$r->user_id] ?? '—',
            'lifetime' => (int) $r->lifetime,
            'available' => (int) ($avail[$r->user_id] ?? 0),
            'referrals' => (int) ($referrals[$r->user_id] ?? 0),
            'contracts' => (int) ($contracts[$r->user_id] ?? 0),
        ])->values();

        // قوائم الاعتماد المعلّقة (لأزرار الاعتماد المباشر).
        $earned = LoyaltyTransaction::whereNotNull('user_id')->where('status', 'earned')
            ->with('user:id,name')->latest()->limit(50)->get()
            ->map(fn (LoyaltyTransaction $t): array => [
                'id' => $t->id, 'user' => $t->user?->name, 'points' => $t->points,
                'description' => $t->description, 'created_at' => $t->created_at?->toIso8601String(),
            ]);
        $redemptions = PointRedemptionRequest::where('status', 'pending')
            ->with('user:id,name')->latest()->limit(50)->get()
            ->map(fn (PointRedemptionRequest $r): array => [
                'id' => $r->id, 'user' => $r->user?->name, 'points' => $r->points,
                'amount_kwd' => $r->amount_kwd, 'created_at' => $r->created_at?->toIso8601String(),
            ]);

        return $this->ok([
            'leads' => $leadStats,
            'points' => $pointStats,
            'financial' => $financial,
            'ranking' => $ranking,
            'approvals' => ['earned' => $earned, 'redemptions' => $redemptions],
        ]);
    }
}
