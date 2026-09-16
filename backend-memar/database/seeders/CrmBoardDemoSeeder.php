<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Contact;
use App\Models\CrmTag;
use App\Models\LeadReminder;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * تفاصيل بطاقات لوحة الفرص (طلب أيمن 2026-09-16): أسعار ثلاثة ونقاطها،
 * واختصارات ملوّنة، ومواعيد تواصل، وطلب تحديث بمهلة — كما في اللوحة المرجعية.
 *
 * لا يلمس قيمةً مكتوبة أصلًا: يملأ الفارغ وحده، فإعادة تشغيله آمنة ولا تمسح
 * ما أدخله الفريق يدويًّا.
 */
class CrmBoardDemoSeeder extends Seeder
{
    /** اختصارات إضافية للوحة — تُعتمد مباشرة لأنها من كتالوج الإدارة. */
    private const EXTRA_TAGS = [
        'سكني' => '#1760A0',
        'تجاري' => '#5B21B6',
        'حكومي' => '#1D4ED8',
        'صناعي' => '#BE185D',
        'متابعة' => '#0F766E',
    ];

    /** نوع المشروع => الاختصار المناسب له. */
    private const TYPE_TAG = [
        'فيلا سكنية' => 'سكني', 'بيت حكومي' => 'حكومي', 'شقة / دور' => 'سكني', 'عمارة استثمارية' => 'سكني',
        'مبنى تجاري' => 'تجاري', 'مبنى إداري' => 'تجاري', 'مجمع تجاري' => 'تجاري', 'مسجد' => 'حكومي',
        'مخزن / مستودع' => 'صناعي', 'مستودع / مصنع' => 'صناعي', 'تصميم داخلي' => 'معماري',
        'ترميم / إضافة' => 'معماري', 'ترميم وتجديد' => 'معماري', 'تنسيق حدائق' => 'معماري',
    ];

    public function run(): void
    {
        foreach (self::EXTRA_TAGS as $name => $color) {
            CrmTag::firstOrCreate(['name' => $name], ['color' => $color, 'status' => 'approved', 'decided_at' => Carbon::now()]);
        }

        // مرسل طلبات التحديث: الأدمن إن وُجد دوره، وإلا أول مستخدم.
        $manager = User::whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))->first() ?? User::first();
        $leads = Contact::where('type', 'lead')->whereNull('archived_at')->orderBy('id')->get();

        foreach ($leads->values() as $index => $lead) {
            $this->fillPrices($lead, $index);
            $this->fillTags($lead, $index);
            $this->fillReminder($lead, $index);
            $this->fillDirective($lead, $index, $manager);
        }
    }

    /** ثلاثة أسعار متدرّجة، أوسطها المرجَّح، ونقاطها — وفرصتان بلا نقاط لتظهر «بانتظار المدير». */
    private function fillPrices(Contact $lead, int $index): void
    {
        if ((float) $lead->price_1_kwd > 0) {
            return;
        }

        $base = (float) $lead->deal_value_kwd > 0 ? (float) $lead->deal_value_kwd : 1_500 + ($index % 7) * 1_250;
        $prices = [round($base * 0.8), round($base), round($base * 1.35)];
        // النقاط تتبع السعر (كل 50 د.ك نقطة)، وتُترك صفرًا لفرصتين فتظهر «بانتظار المدير».
        $awaitingPoints = $index % 6 === 2;

        $lead->forceFill([
            'price_1_kwd' => $prices[0],
            'price_2_kwd' => $prices[1],
            'price_3_kwd' => $prices[2],
            'expected_price_kwd' => $lead->expected_price_kwd ?: $prices[1],
            'points_1' => $awaitingPoints ? 0 : (int) round($prices[0] / 50),
            'points_2' => $awaitingPoints ? 0 : (int) round($prices[1] / 50),
            'points_3' => $awaitingPoints ? 0 : (int) round($prices[2] / 50),
            'area_sqm' => $lead->area_sqm ?: 300 + ($index % 8) * 75,
            'block_no' => $lead->block_no ?: (string) (1 + $index % 9),
            'plot_no' => $lead->plot_no ?: (string) (100 + $index * 7 % 400),
        ])->save();
    }

    /** اختصار يصف نوع المشروع + وسم حالة، و«VIP» لكل فرصة رابعة. */
    private function fillTags(Contact $lead, int $index): void
    {
        $current = array_values(array_filter($lead->tags ?? [], fn (string $t): bool => $t !== 'تجريبي'));
        if ($current !== []) {
            return;
        }

        $tags = [];
        if ($typeTag = self::TYPE_TAG[$lead->project_type] ?? null) {
            $tags[] = $typeTag;
        }
        $tags[] = [0 => 'مهم', 1 => 'متابعة', 2 => 'عاجل'][$index % 3];

        $lead->forceFill([
            'tags' => array_values(array_unique([...$tags, ...($lead->tags ?? [])])),
            'is_vip' => $lead->is_vip || $index % 4 === 0,
        ])->save();
    }

    /** موعد تواصل: متأخر، أو اليوم، أو خلال أيام — فتظهر ألوان العدّاد كلها. */
    private function fillReminder(Contact $lead, int $index): void
    {
        if ($lead->reminders()->where('done', false)->exists()) {
            return;
        }

        $when = match ($index % 4) {
            0 => Carbon::now()->subDays(2)->setTime(10, 0),
            1 => Carbon::now()->setTime(16, 30),
            2 => Carbon::now()->addDays(3)->setTime(11, 0),
            default => Carbon::now()->addDays(7)->setTime(9, 30),
        };

        LeadReminder::create([
            'contact_id' => $lead->id,
            'assignee_id' => $lead->owner_id,
            'created_by' => $lead->owner_id,
            'remind_at' => $when,
            'note' => 'متابعة العميل ومراجعة عرض السعر',
            'done' => false,
        ]);
    }

    /** طلب تحديث من الإدارة بمهلة: منتهية، أو جارية، أو بلا مهلة. */
    private function fillDirective(Contact $lead, int $index, ?User $manager): void
    {
        if ($manager === null || $index % 5 !== 0 || $lead->directives()->exists()) {
            return;
        }

        $deadline = match ($index % 15) {
            0 => Carbon::now()->subHours(2),   // انتهت المهلة — إنذار أحمر
            5 => Carbon::now()->addHours(4),   // مهلة جارية — عدّاد تنازلي
            default => null,                   // بدون مهلة — «مطلوب الآن»
        };

        $lead->directives()->create([
            'sender_id' => $manager->id,
            'body' => 'ما آخر مستجدات هذه الفرصة؟ نحتاج ردًّا اليوم.',
            'deadline_at' => $deadline,
        ]);
    }
}
