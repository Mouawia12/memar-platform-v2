<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Contact;
use App\Models\Invoice;
use App\Models\LoyaltyRedemption;
use App\Models\LoyaltyTransaction;
use App\Models\Referral;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * محرّك برنامج الولاء والإحالة.
 *
 * قواعد النظام كلها من config/loyalty.php ليضبطها أيمن دون لمس المنطق.
 * كل تغيّر في الرصيد يمرّ من هنا ويُكتب في السجل (loyalty_transactions) —
 * مصدر الحقيقة الوحيد؛ لا تُعدَّل النقاط على العميل مباشرة من أي مكان آخر.
 */
class LoyaltyService
{
    /**
     * منح نقاط للعميل وتسجيل الحركة. يحدّث الرصيد الحالي و«مدى الحياة» (للمستويات).
     * idempotencyKey اختياري: يمنع تكرار نفس المنح لنفس المرجع/المصدر.
     */
    public function award(Contact $contact, int $points, string $source, ?Model $reference = null, ?string $description = null): ?LoyaltyTransaction
    {
        if ($points <= 0) {
            return null;
        }

        return DB::transaction(function () use ($contact, $points, $source, $reference, $description): LoyaltyTransaction {
            $contact->refresh();
            $balance = $contact->loyalty_points + $points;

            $contact->forceFill([
                'loyalty_points' => $balance,
                'loyalty_points_lifetime' => $contact->loyalty_points_lifetime + $points,
            ])->save();

            return $this->writeLedger($contact, $points, $balance, $source, $reference, $description);
        });
    }

    /* ═══════════════ نقاط الموظفين (users) — الرصيد يُحسب من السجل مباشرة ═══════════════ */

    /** رصيد نقاط الموظف الحالي (مجموع كل حركاته، بأي حالة). */
    public function userBalance(User $user): int
    {
        return (int) LoyaltyTransaction::where('user_id', $user->id)->sum('points');
    }

    /**
     * الرصيد القابل للاستبدال فعليًا: حركات الحالة «available» فقط (يستثني المعلّقة والمستحقة
     * التي تنتظر اعتماد الإدارة، والملغاة). الصرف (سالب) الحالته available يخصم بشكل صحيح.
     */
    public function userAvailableBalance(User $user): int
    {
        return (int) LoyaltyTransaction::where('user_id', $user->id)
            ->where('status', LoyaltyTransaction::STATUS_AVAILABLE)
            ->sum('points');
    }

    /**
     * تفصيل محفظة الموظف حسب حالة النقاط (للعرض): معلّقة/مستحقة/متاحة/مستبدلة.
     *
     * @return array{pending:int, earned:int, available:int, redeemed:int}
     */
    public function userPointsByStatus(User $user): array
    {
        $base = fn (): \Illuminate\Database\Eloquent\Builder => LoyaltyTransaction::where('user_id', $user->id);

        return [
            'pending' => (int) $base()->where('status', LoyaltyTransaction::STATUS_PENDING)->where('points', '>', 0)->sum('points'),
            'earned' => (int) $base()->where('status', LoyaltyTransaction::STATUS_EARNED)->where('points', '>', 0)->sum('points'),
            'available' => $this->userAvailableBalance($user),
            'redeemed' => (int) abs((int) $base()->where('points', '<', 0)->sum('points')),
        ];
    }

    /** نقاط الموظف مدى الحياة (الموجبة فقط). */
    public function userLifetime(User $user): int
    {
        return (int) LoyaltyTransaction::where('user_id', $user->id)->where('points', '>', 0)->sum('points');
    }

    /**
     * منح الموظف نقاطًا وتسجيل الحركة (contact_id = NULL كي لا تختلط برصيد عميل).
     * $status يحدّد مرحلة دورة الحياة (متاح افتراضيًا؛ يُمرَّر pending/earned في المسارات الجديدة).
     */
    public function awardUser(User $user, int $points, string $source, ?Model $reference = null, ?string $description = null, string $status = LoyaltyTransaction::STATUS_AVAILABLE): ?LoyaltyTransaction
    {
        if ($points <= 0) {
            return null;
        }

        return DB::transaction(function () use ($user, $points, $source, $reference, $description, $status): LoyaltyTransaction {
            $balance = $this->userBalance($user) + $points;

            return LoyaltyTransaction::create([
                'user_id' => $user->id,
                'contact_id' => null,
                'points' => $points,
                'balance_after' => $balance,
                'source' => $source,
                'status' => $status,
                'description' => $description,
                'reference_type' => $reference ? $reference::class : null,
                'reference_id' => $reference?->getKey(),
            ]);
        });
    }

    /**
     * صرف نقاط موظف (سالبة) عند اعتماد استبدالها بالراتب. تُكتب بحالة «available» كي تخصم
     * من الرصيد المتاح بشكل صحيح (تفصيل «مستبدلة» في العرض يُحسب من الحركات السالبة).
     */
    public function redeemUserPoints(User $user, int $points, string $description, ?Model $reference = null): LoyaltyTransaction
    {
        return DB::transaction(function () use ($user, $points, $description, $reference): LoyaltyTransaction {
            $balance = $this->userBalance($user) - $points;

            return LoyaltyTransaction::create([
                'user_id' => $user->id,
                'contact_id' => null,
                'points' => -$points,
                'balance_after' => $balance,
                'source' => 'salary_conversion',
                'status' => LoyaltyTransaction::STATUS_AVAILABLE,
                'description' => $description,
                'reference_type' => $reference ? $reference::class : null,
                'reference_id' => $reference?->getKey(),
            ]);
        });
    }

    /**
     * اعتماد نقاط مستحقة → متاحة (خطوة موافقة الإدارة). يعمل فقط على حركة موظف مستحقة.
     */
    public function approveUserTransaction(LoyaltyTransaction $tx): LoyaltyTransaction
    {
        if ($tx->user_id === null || $tx->status !== LoyaltyTransaction::STATUS_EARNED) {
            throw new RuntimeException('لا يمكن اعتماد هذه الحركة (ليست نقاطًا مستحقة لموظف).');
        }
        $tx->forceFill(['status' => LoyaltyTransaction::STATUS_AVAILABLE])->save();

        return $tx;
    }

    /** إلغاء نقاط موظف (لا تُحتسب بعدها). يُسمح بإلغاء المعلّقة والمستحقة والمتاحة. */
    public function cancelUserTransaction(LoyaltyTransaction $tx): LoyaltyTransaction
    {
        if ($tx->user_id === null || $tx->status === LoyaltyTransaction::STATUS_REDEEMED) {
            throw new RuntimeException('لا يمكن إلغاء هذه الحركة.');
        }
        $tx->forceFill(['status' => LoyaltyTransaction::STATUS_CANCELLED])->save();

        return $tx;
    }

    /**
     * تحويل نقاط الموظف إلى رصيد راتب (config: 50 نقطة = 1 د.ك). يخصم النقاط ويعيد المبلغ.
     *
     * @return array{points:int, kwd:float, balance:int}
     *
     * @throws RuntimeException تحت الحدّ الأدنى أو عند نقص الرصيد
     */
    public function convertUserPointsToSalary(User $user, int $points): array
    {
        $rate = (int) config('loyalty.salary.points_per_kwd', 50);
        $min = (int) config('loyalty.salary.min_points', 50);

        return DB::transaction(function () use ($user, $points, $rate, $min): array {
            // يُحوَّل من النقاط المتاحة فقط (المعلّقة/المستحقة تنتظر اعتماد الإدارة).
            $balance = $this->userAvailableBalance($user);
            if ($points > $balance) {
                throw new RuntimeException('النقاط غير كافية.');
            }
            // نحوّل مضاعفات السعر فقط كي لا تضيع كسور النقاط.
            $convertible = intdiv($points, $rate) * $rate;
            if ($convertible < $min) {
                throw new RuntimeException("أقل تحويل {$min} نقطة.");
            }
            $kwd = $convertible / $rate;
            $newBalance = $balance - $convertible;

            LoyaltyTransaction::create([
                'user_id' => $user->id,
                'contact_id' => null,
                'points' => -$convertible,
                'balance_after' => $newBalance,
                'source' => 'salary_conversion',
                'description' => "تحويل {$convertible} نقطة إلى رصيد راتب: " . number_format($kwd, 3) . ' د.ك',
            ]);

            return ['points' => $convertible, 'kwd' => $kwd, 'balance' => $newBalance];
        });
    }

    /**
     * استبدال نقاط برصيد خصم (قسيمة). يتحقّق من الرصيد والحدّ الأدنى.
     *
     * @throws RuntimeException عند نقص الرصيد أو تحت الحدّ الأدنى
     */
    public function redeem(Contact $contact, int $points): LoyaltyRedemption
    {
        $min = (int) config('loyalty.redeem.min_points');
        $perKwd = (int) config('loyalty.redeem.points_per_kwd');

        if ($points < $min) {
            throw new RuntimeException("أقل استبدال هو {$min} نقطة.");
        }

        return DB::transaction(function () use ($contact, $points, $perKwd): LoyaltyRedemption {
            $contact->refresh();

            if ($contact->loyalty_points < $points) {
                throw new RuntimeException('رصيد النقاط غير كافٍ.');
            }

            $balance = $contact->loyalty_points - $points;
            $contact->forceFill(['loyalty_points' => $balance])->save();

            $redemption = LoyaltyRedemption::create([
                'contact_id' => $contact->id,
                'code' => $this->uniqueVoucherCode(),
                'points_spent' => $points,
                'amount_kwd' => round($points / $perKwd, 3),
                'status' => 'available',
            ]);

            $this->writeLedger($contact, -$points, $balance, 'redeem', $redemption, "استبدال {$points} نقطة برصيد خصم");

            return $redemption;
        });
    }

    /**
     * تطبيق قسيمة متاحة على فاتورة غير مسدّدة: يزيد paid_kwd بقيمة القسيمة،
     * ويحدّث حالة الفاتورة، ويقفل القسيمة (applied). يعيد المبلغ المطبَّق.
     *
     * @throws RuntimeException إن لم تكن القسيمة متاحة أو الفاتورة لعميل آخر
     */
    public function applyRedemptionToInvoice(LoyaltyRedemption $redemption, Invoice $invoice): float
    {
        if ($redemption->status !== 'available') {
            throw new RuntimeException('القسيمة غير متاحة.');
        }
        if ($invoice->client_id !== $redemption->contact_id) {
            throw new RuntimeException('الفاتورة لا تخصّ صاحب القسيمة.');
        }

        return DB::transaction(function () use ($redemption, $invoice): float {
            $due = max(0, (float) $invoice->total_kwd - (float) $invoice->paid_kwd);
            $applied = min($due, (float) $redemption->amount_kwd);

            $paid = (float) $invoice->paid_kwd + $applied;
            $invoice->forceFill([
                'paid_kwd' => $paid,
                'status' => $paid >= (float) $invoice->total_kwd ? 'paid' : 'partial',
            ])->save();

            $redemption->forceFill([
                'status' => 'applied',
                'invoice_id' => $invoice->id,
                'applied_at' => now(),
            ])->save();

            return $applied;
        });
    }

    /** رصيد النقاط الحالي. */
    public function balance(Contact $contact): int
    {
        return (int) $contact->loyalty_points;
    }

    /** رصيد الخصم المتاح (مجموع القسائم غير المستخدمة) بالدينار. */
    public function availableCredit(Contact $contact): float
    {
        return (float) $contact->loyaltyRedemptions()->where('status', 'available')->sum('amount_kwd');
    }

    /**
     * مستوى العميل الحالي + المستوى التالي ونسبة التقدّم — بناءً على نقاط مدى الحياة.
     *
     * @return array{key:string,label:string,discount_bonus_pct:int,perks:array<int,string>,lifetime:int,next:?array{label:string,min:int,remaining:int},progress:int}
     */
    public function tier(Contact $contact): array
    {
        /** @var array<int,array<string,mixed>> $tiers */
        $tiers = config('loyalty.tiers');
        $lifetime = (int) $contact->loyalty_points_lifetime;

        $current = $tiers[0];
        $next = null;
        foreach ($tiers as $i => $tier) {
            if ($lifetime >= $tier['min']) {
                $current = $tier;
                $next = $tiers[$i + 1] ?? null;
            }
        }

        $progress = 100;
        $nextInfo = null;
        if ($next !== null) {
            $span = max(1, (int) $next['min'] - (int) $current['min']);
            $done = $lifetime - (int) $current['min'];
            $progress = (int) min(100, max(0, round($done / $span * 100)));
            $nextInfo = [
                'label' => $next['label'],
                'min' => (int) $next['min'],
                'remaining' => max(0, (int) $next['min'] - $lifetime),
            ];
        }

        return [
            'key' => $current['key'],
            'label' => $current['label'],
            'discount_bonus_pct' => (int) $current['discount_bonus_pct'],
            'perks' => $current['perks'],
            'lifetime' => $lifetime,
            'next' => $nextInfo,
            'progress' => $progress,
        ];
    }

    /** يضمن وجود كود إحالة شخصي ثابت للعميل ويعيده. */
    public function ensureReferralCode(Contact $contact): string
    {
        if ($contact->referral_code) {
            return $contact->referral_code;
        }

        $base = 'MEMAR-'.Str::upper(Str::slug(Str::ascii($contact->full_name ?: 'client'), ''));
        $base = $base !== 'MEMAR-' ? $base : 'MEMAR-'.str_pad((string) $contact->id, 4, '0', STR_PAD_LEFT);
        $code = $base.now()->year;

        $n = 1;
        while (Contact::where('referral_code', $code)->exists()) {
            $code = $base.now()->year.'-'.$n++;
        }

        $contact->forceFill(['referral_code' => $code])->save();

        return $code;
    }

    /** إيجاد المُحيل من كود الإحالة (عميل). */
    public function resolveReferrer(string $code): ?Contact
    {
        $code = trim($code);

        return $code === '' ? null : Contact::where('referral_code', $code)->first();
    }

    /**
     * تسجيل إحالة عند فتح الصديق لحسابه بكود مُحيل: يربط العلاقة، يُنشئ صف الإحالة
     * (joined)، ويمنح المُحيل نقاط «الانضمام». يتجاهل الإحالة الذاتية والتكرار.
     */
    public function registerReferral(Contact $referred, Contact $referrer): ?Referral
    {
        if ($referrer->id === $referred->id) {
            return null;
        }

        $existing = Referral::where('referrer_contact_id', $referrer->id)
            ->where('referred_contact_id', $referred->id)
            ->first();
        if ($existing) {
            return $existing;
        }

        $referred->forceFill(['referred_by_contact_id' => $referrer->id])->save();

        $referral = Referral::create([
            'referrer_contact_id' => $referrer->id,
            'referred_contact_id' => $referred->id,
            'referred_name' => $referred->full_name,
            'status' => 'joined',
            'welcome_discount_pct' => (int) config('loyalty.welcome_discount_pct'),
            'joined_at' => now(),
        ]);

        $this->award($referrer, (int) config('loyalty.earn.referral_joined'), 'referral', $referral, "انضمّ صديقك {$referred->full_name} عبر كودك");

        return $referral;
    }

    /**
     * ترقية إحالة الصديق إلى «ناجحة» عند تعاقده أول مرة، ومنح المُحيل مكافأة الإحالة.
     * يُستدعى مرّة واحدة (idempotent) من مسار إنشاء العقد.
     */
    public function markReferredContracted(Contact $referred): void
    {
        $referral = Referral::where('referred_contact_id', $referred->id)
            ->where('status', '!=', 'contracted')
            ->first();

        if (! $referral) {
            return;
        }

        $reward = (int) config('loyalty.earn.referral_contracted');
        $referrer = $referral->referrer;

        DB::transaction(function () use ($referral, $referrer, $reward, $referred): void {
            $referral->forceFill([
                'status' => 'contracted',
                'points_awarded' => $reward,
                'contracted_at' => now(),
            ])->save();

            if ($referrer) {
                $this->award($referrer, $reward, 'referral', $referral, "تعاقد صديقك {$referred->full_name} — إحالة ناجحة");
            }
        });
    }

    /** نقاط تفاعل عند مشاركة الكود، ضمن سقف تراكمي. يعيد النقاط الممنوحة فعليًا. */
    public function recordShare(Contact $contact): int
    {
        $contact->increment('referral_shares');

        $cap = (int) config('loyalty.share_points_cap');
        $earnedFromShares = (int) $contact->loyaltyTransactions()->where('source', 'share')->sum('points');
        $per = (int) config('loyalty.earn.share');
        $grant = min($per, max(0, $cap - $earnedFromShares));

        if ($grant > 0) {
            $this->award($contact, $grant, 'share', null, 'مكافأة مشاركة كود الإحالة');
        }

        return $grant;
    }

    private function writeLedger(Contact $contact, int $points, int $balanceAfter, string $source, ?Model $reference, ?string $description): LoyaltyTransaction
    {
        return LoyaltyTransaction::create([
            'contact_id' => $contact->id,
            'points' => $points,
            'balance_after' => $balanceAfter,
            'source' => $source,
            'description' => $description,
            'reference_type' => $reference ? $reference::class : null,
            'reference_id' => $reference?->getKey(),
        ]);
    }

    private function uniqueVoucherCode(): string
    {
        do {
            $code = 'LP-'.Str::upper(Str::random(6));
        } while (LoyaltyRedemption::where('code', $code)->exists());

        return $code;
    }
}
