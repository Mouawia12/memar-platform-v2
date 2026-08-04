<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Contact;
use App\Models\Referral;
use App\Models\User;
use App\Services\LoyaltyService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

/**
 * بيانات عرض لبرنامج الولاء والإحالة — سجل نقاط واقعي + إحالات + قسيمة استبدال
 * للعملاء التجريبيين. idempotent: يمسح ويعيد بناء ولاء هؤلاء العملاء فقط.
 */
class LoyaltyDemoSeeder extends Seeder
{
    public function run(LoyaltyService $loyalty): void
    {
        $ahmad = User::where('email', 'client1@memar.kw')->first()?->contact;
        $khalid = User::where('email', 'client2@memar.kw')->first()?->contact;
        $amna = User::where('email', 'client3@memar.kw')->first()?->contact;

        if (! $ahmad) {
            return;
        }

        foreach (array_filter([$ahmad, $khalid, $amna]) as $c) {
            $this->reset($c);
            $loyalty->ensureReferralCode($c);
        }

        // ── أحمد المنصور: عميل مميّز (مستوى فضي، يتقدّم نحو الذهبي) ──
        $this->earn($loyalty, $ahmad, 100, 'signup', 'مكافأة ترحيبية بفتح الحساب', 210);
        $this->earn($loyalty, $ahmad, 300, 'project_completed', 'إتمام مشروع «فيلا الرياض - حي النرجس»', 150);
        $this->earn($loyalty, $ahmad, 250, 'invoice_paid', 'سداد فاتورة في موعدها (250 د.ك)', 120);
        $this->earn($loyalty, $ahmad, 300, 'project_completed', 'إتمام مشروع «مجمع تجاري - جدة»', 60);
        $this->earn($loyalty, $ahmad, 400, 'anniversary', 'ذكرى سنوية للعضوية (سنتان)', 30);

        // إحالة ناجحة (خالد تعاقد) + إحالة قيد الانتظار (سعود سجّل ولم يتعاقد)
        if ($khalid) {
            $khalid->forceFill(['referred_by_contact_id' => $ahmad->id])->save();
            $r1 = Referral::create([
                'referrer_contact_id' => $ahmad->id, 'referred_contact_id' => $khalid->id,
                'referred_name' => $khalid->full_name, 'status' => 'contracted',
                'points_awarded' => 500, 'welcome_discount_pct' => 10,
                'joined_at' => Carbon::now()->subDays(95), 'contracted_at' => Carbon::now()->subDays(80),
            ]);
            $this->earn($loyalty, $ahmad, 500, 'referral', "تعاقد صديقك {$khalid->full_name} — إحالة ناجحة", 80, $r1);
        }
        $r2 = Referral::create([
            'referrer_contact_id' => $ahmad->id, 'referred_name' => 'سعود المطيري',
            'status' => 'joined', 'points_awarded' => 50, 'welcome_discount_pct' => 10,
            'joined_at' => Carbon::now()->subDays(20),
        ]);
        $this->earn($loyalty, $ahmad, 50, 'referral', 'انضمّ صديقك سعود المطيري عبر كودك', 20, $r2);

        // استبدال نقاط سابق → قسيمة خصم 3 د.ك
        $voucher = $loyalty->redeem($ahmad, 300);
        $this->backdate($ahmad, 15);
        $voucher->forceFill(['created_at' => Carbon::now()->subDays(15)])->save();

        // ── خالد العازمي: عميل جديد (برونزي) أحاله أحمد، وأحال بدوره صديقًا ──
        if ($khalid) {
            $this->earn($loyalty, $khalid, 100, 'signup', 'مكافأة ترحيبية بفتح الحساب', 78);
            $this->earn($loyalty, $khalid, 250, 'project_completed', 'إتمام مشروع «عمارة استثمارية - الفروانية»', 30);
            $rk = Referral::create([
                'referrer_contact_id' => $khalid->id, 'referred_name' => 'ناصر العتيبي',
                'status' => 'joined', 'points_awarded' => 50, 'welcome_discount_pct' => 10,
                'joined_at' => Carbon::now()->subDays(12),
            ]);
            $this->earn($loyalty, $khalid, 50, 'referral', 'انضمّ صديقك ناصر العتيبي عبر كودك', 12, $rk);
            $khalid->increment('referral_shares', 4);
        }

        $ahmad->increment('referral_shares', 9);
    }

    /** يمسح ولاء العميل (سجل + قسائم + إحالاته كمُحيل) ويصفّر رصيده. */
    private function reset(Contact $c): void
    {
        $c->loyaltyTransactions()->delete();
        $c->loyaltyRedemptions()->delete();
        Referral::where('referrer_contact_id', $c->id)->delete();
        $c->forceFill(['loyalty_points' => 0, 'loyalty_points_lifetime' => 0, 'referral_shares' => 0])->save();
    }

    /** يمنح نقاطًا عبر الخدمة (سجل حقيقي) مع تأريخ الحركة للخلف لواقعية العرض. */
    private function earn(LoyaltyService $loyalty, Contact $c, int $points, string $source, string $desc, int $daysAgo, ?Referral $ref = null): void
    {
        $tx = $loyalty->award($c, $points, $source, $ref, $desc);
        $tx?->forceFill(['created_at' => Carbon::now()->subDays($daysAgo)])->save();
    }

    private function backdate(Contact $c, int $daysAgo): void
    {
        $c->loyaltyTransactions()->where('source', 'redeem')->latest('id')->first()
            ?->forceFill(['created_at' => Carbon::now()->subDays($daysAgo)])->save();
    }
}
