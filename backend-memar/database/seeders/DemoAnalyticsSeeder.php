<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Contact;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\Service;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * بيانات تجريبية لملء رسمَي «الحضور» و«الخدمات» في التقارير — لأغراض العرض فقط.
 *
 * آمن تمامًا: إضافي فقط، ولا يحذف أو يعدّل أي بيانات قائمة، وقابل لإعادة التشغيل
 * دون تكرار (يعتمد firstOrCreate وعلامات مميّزة). وكل ما يُنشئه قابل للحذف لاحقًا:
 *   - الحضور: method = 'seed'
 *   - عرض السعر التجريبي: number = 'DEMO-ANALYTICS'
 * لإزالته: php artisan db:seed --class=DemoAnalyticsSeeder ثم احذف بهاتين العلامتين.
 */
class DemoAnalyticsSeeder extends Seeder
{
    /** كم أسبوعًا للخلف نملأ الحضور (يكفي لعرض شهر/ربع). */
    private const WEEKS_BACK = 6;

    public function run(): void
    {
        $this->seedAttendance();
        $this->seedServiceQuotation();
    }

    /** حضور أيام العمل (السبت→الخميس) للموظفين النشطين، بنمط ثابت متنوّع. */
    private function seedAttendance(): void
    {
        $users = User::where('is_active', true)->get(['id']);
        if ($users->isEmpty()) {
            $this->command?->warn('لا يوجد مستخدمون نشطون — تُخطّى بيانات الحضور.');

            return;
        }

        $today = CarbonImmutable::now()->startOfDay();
        $start = $today->subWeeks(self::WEEKS_BACK);
        $created = 0;

        foreach ($users as $index => $user) {
            for ($date = $start; $date->lte($today); $date = $date->addDay()) {
                // الجمعة عطلة أسبوعية
                if ($date->dayOfWeek === CarbonImmutable::FRIDAY) {
                    continue;
                }

                [$status, $checkIn, $checkOut, $minutes] = $this->dayPattern($index, $date);

                // firstOrCreate على (user_id, date) — لن يُكرّر أو يمسّ سجلًا حقيقيًا موجودًا
                $record = Attendance::firstOrCreate(
                    ['user_id' => $user->id, 'date' => $date->toDateString()],
                    [
                        'status' => $status,
                        'check_in_at' => $checkIn ? $date->setTime((int) $checkIn, 0) : null,
                        'check_out_at' => $checkOut ? $date->setTime((int) $checkOut, 0) : null,
                        'work_minutes' => $minutes,
                        'method' => 'seed',
                    ],
                );

                if ($record->wasRecentlyCreated) {
                    $created++;
                }
            }
        }

        $this->command?->info("الحضور: أُضيف {$created} سجلًا تجريبيًا (method=seed).");
    }

    /**
     * نمط يوم ثابت لكل موظف/تاريخ — بلا عشوائية ليبقى إعادة التشغيل مستقرًّا.
     *
     * @return array{0: string, 1: int|null, 2: int|null, 3: int|null}
     */
    private function dayPattern(int $userIndex, CarbonImmutable $date): array
    {
        $seed = $userIndex + (int) $date->format('z'); // فهرس الموظف + ترتيب اليوم في السنة

        return match (true) {
            $seed % 19 === 0 => ['leave', null, null, null],      // إجازة نادرة
            $seed % 13 === 0 => ['absent', null, null, null],     // غياب أندر
            $seed % 7 === 0 => ['late', 10, 17, 7 * 60],          // تأخّر أحيانًا
            default => ['present', 8, 17, 9 * 60],                // الأغلب حضور
        };
    }

    /** عرض سعر تجريبي واحد ببنود عبر عدّة خدمات — لملء رسم توزيع الخدمات. */
    private function seedServiceQuotation(): void
    {
        if (Quotation::where('number', 'DEMO-ANALYTICS')->exists()) {
            $this->command?->info('الخدمات: عرض السعر التجريبي موجود مسبقًا — تُخطّى.');

            return;
        }

        $services = Service::query()->orderBy('id')->take(6)->get();
        if ($services->count() < 2) {
            $this->command?->warn('لا توجد خدمات كافية — يُخطّى عرض السعر التجريبي.');

            return;
        }

        DB::transaction(function () use ($services): void {
            $quotation = Quotation::create([
                'number' => 'DEMO-ANALYTICS',
                'client_id' => Contact::query()->value('id'),
                'status' => 'sent',
                'subtotal_kwd' => 0,
                'discount_kwd' => 0,
                'total_kwd' => 0,
                'valid_until' => CarbonImmutable::now()->addDays(30)->toDateString(),
                'notes' => 'بيانات عرض تجريبية لرسم التقارير (قابلة للحذف).',
            ]);

            $total = 0.0;
            foreach ($services as $i => $service) {
                $qty = $i + 1;                                   // كميات متدرّجة لتوزيع واضح
                $unit = (float) ($service->price_kwd ?: 250);
                $line = round($qty * $unit, 3);
                $total += $line;

                QuotationItem::create([
                    'quotation_id' => $quotation->id,
                    'service_id' => $service->id,
                    'description' => $service->name,
                    'qty' => $qty,
                    'unit_price_kwd' => $unit,
                    'total_kwd' => $line,
                ]);
            }

            $quotation->update(['subtotal_kwd' => $total, 'total_kwd' => $total]);
        });

        $this->command?->info('الخدمات: أُنشئ عرض سعر تجريبي (DEMO-ANALYTICS) ببنود عبر الخدمات.');
    }
}
