<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Appointment;
use App\Models\Contact;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * حجز مواعيد مناقشة السعر من الموقع العام — بنفس قواعد محرّك التسعير القديم،
 * لكن مدعومًا بجدول المواعيد الحقيقي فيُمنع تعارض موعدين على نفس الساعة.
 *
 * أيام العمل: السبت→الخميس (الجمعة عطلة). الخميس دوام قصير.
 * الساعات بنظام 24، وكل موعد مدّته ساعة.
 */
class BookingService
{
    /** ساعات الدوام الكامل (11 ص → 7 م). */
    private const FULL_HOURS = [11, 12, 13, 14, 15, 16, 17, 18, 19];

    /** ساعات الدوام القصير (الخميس). */
    private const SHORT_HOURS = [11, 12];

    /** لا يُحجز موعد قبل هذه المهلة من الآن (دقائق). */
    private const MIN_LEAD_MINUTES = 60;

    /** أبعد أسبوع يمكن تصفّحه للأمام. */
    private const MAX_WEEK_OFFSET = 8;

    /** عطل الكويت الرسمية 2026–2027 (Y-m-d). */
    private const HOLIDAYS = [
        '2026-01-01', '2026-02-25', '2026-02-26', '2026-03-20',
        '2026-04-01', '2026-04-02', '2026-04-03', '2026-06-07',
        '2026-06-08', '2026-06-09', '2026-06-10', '2026-06-28',
        '2026-09-07', '2027-01-01', '2027-02-25', '2027-02-26',
    ];

    /** أسماء أيام الأسبوع بالعربية (0=الأحد … 6=السبت). */
    private const DAY_NAMES = [
        0 => 'الأحد', 1 => 'الاثنين', 2 => 'الثلاثاء',
        3 => 'الأربعاء', 4 => 'الخميس', 6 => 'السبت',
    ];

    private const FORMAT_LABELS = [
        'office' => '🏢 حضوري في المكتب',
        'video' => '📹 اجتماع أونلاين',
        'voice' => '📞 مكالمة صوتية',
        'whatsapp' => '💬 تواصل واتساب',
    ];

    /**
     * أسبوع من الأيام (السبت→الخميس) مع ساعات كلٍّ وأيّها متاح.
     *
     * @return array<string, mixed>
     */
    public function week(int $weekOffset): array
    {
        $offset = max(0, min($weekOffset, self::MAX_WEEK_OFFSET));
        $now = CarbonImmutable::now();
        $minBookable = $now->addMinutes(self::MIN_LEAD_MINUTES);

        // بداية الأسبوع = أقرب سبت ماضٍ (أو اليوم) + إزاحة الأسابيع
        $daysSinceSaturday = ($now->dayOfWeek - CarbonImmutable::SATURDAY + 7) % 7;
        $weekStart = $now->startOfDay()->subDays($daysSinceSaturday)->addWeeks($offset);

        $booked = $this->bookedSlots($weekStart, $weekStart->addDays(6));

        $days = [];
        for ($i = 0; $i < 6; $i++) {   // 6 أيام: السبت → الخميس
            $date = $weekStart->addDays($i);
            $dateStr = $date->toDateString();
            $isHoliday = in_array($dateStr, self::HOLIDAYS, true);
            $isPast = $date->lt($now->startOfDay());

            $hours = [];
            foreach ($this->hoursFor($date) as $hour) {
                $slotStart = $date->setTime($hour, 0);
                $available = ! $isHoliday
                    && $slotStart->gt($minBookable)
                    && ! in_array($this->slotKey($dateStr, $hour), $booked, true);

                $hours[] = [
                    'hour' => $hour,
                    'label' => $this->hourLabel($hour),
                    'available' => $available,
                ];
            }

            $days[] = [
                'date' => $dateStr,
                'day_name' => self::DAY_NAMES[$date->dayOfWeek] ?? '',
                'day_month' => $date->day.'/'.$date->month,
                'is_holiday' => $isHoliday,
                'is_past' => $isPast,
                'is_short' => $date->dayOfWeek === CarbonImmutable::THURSDAY,
                'has_availability' => collect($hours)->contains('available', true),
                'hours' => $hours,
            ];
        }

        return [
            'week_offset' => $offset,
            'can_go_back' => $offset > 0,
            'can_go_forward' => $offset < self::MAX_WEEK_OFFSET,
            'label' => $weekStart->day.'/'.$weekStart->month.' – '.$weekStart->addDays(5)->day.'/'.$weekStart->addDays(5)->month,
            'days' => $days,
            'formats' => collect(self::FORMAT_LABELS)->map(fn ($label, $key) => ['value' => $key, 'label' => $label])->values(),
        ];
    }

    /**
     * حجز موعد: ينشئ عميلًا محتملًا وموعدًا في الجدول ويعيد ملخّصه.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     *
     * @throws \RuntimeException إن كان الوقت خارج الدوام أو محجوزًا أو منقضيًا
     */
    public function book(array $data): array
    {
        $date = CarbonImmutable::createFromFormat('Y-m-d', $data['date'])->startOfDay();
        $hour = (int) $data['hour'];
        $slotStart = $date->setTime($hour, 0);

        $this->assertBookable($date, $hour, $slotStart);

        return DB::transaction(function () use ($data, $hour, $slotStart): array {
            // حجز الساعة نفسها مرّتين متزامنتين ممنوع — قفل تشاؤمي على الفتحة
            $taken = Appointment::where('type', 'meeting')
                ->whereBetween('start_at', [$slotStart, $slotStart->addHour()->subSecond()])
                ->whereIn('status', ['pending', 'scheduled', 'done'])
                ->lockForUpdate()
                ->exists();

            if ($taken) {
                throw new \RuntimeException('عذرًا، حُجز هذا الموعد للتو. اختر وقتًا آخر.');
            }

            $format = (string) $data['format'];
            $contact = $this->findOrCreateLead($data);

            $appointment = Appointment::create([
                'title' => 'مناقشة عرض السعر — '.($data['name'] ?? 'عميل'),
                'type' => 'meeting',
                'start_at' => $slotStart,
                'end_at' => $slotStart->addHour(),
                'location' => $format === 'office' ? 'مقر المكتب' : null,
                'is_video' => in_array($format, ['video', 'voice'], true),
                'status' => 'pending',
                'notes' => trim(
                    'طريقة الاجتماع: '.(self::FORMAT_LABELS[$format] ?? $format)
                    ."\nالعميل: ".($data['name'] ?? '—').' — '.($data['phone'] ?? '—')
                    ."\nمصدر الطلب: الموقع الإلكتروني (حجز موعد السعر)"
                    .(isset($contact->id) ? "\nجهة الاتصال #".$contact->id : '')
                ),
            ]);

            return [
                'reference' => $this->reference($appointment->id, $slotStart),
                'date' => $slotStart->toDateString(),
                'day_label' => (self::DAY_NAMES[$slotStart->dayOfWeek] ?? '').' '.$slotStart->day.'/'.$slotStart->month.'/'.$slotStart->year,
                'hour_label' => $this->hourLabel($hour),
                'format_label' => self::FORMAT_LABELS[$format] ?? $format,
            ];
        });
    }

    /**
     * @throws \RuntimeException
     */
    private function assertBookable(CarbonImmutable $date, int $hour, CarbonImmutable $slotStart): void
    {
        if ($date->dayOfWeek === CarbonImmutable::FRIDAY) {
            throw new \RuntimeException('الجمعة عطلة أسبوعية.');
        }
        if (in_array($date->toDateString(), self::HOLIDAYS, true)) {
            throw new \RuntimeException('هذا اليوم عطلة رسمية.');
        }
        if (! in_array($hour, $this->hoursFor($date), true)) {
            throw new \RuntimeException('الوقت المختار خارج أوقات الدوام.');
        }
        if ($slotStart->lte(CarbonImmutable::now()->addMinutes(self::MIN_LEAD_MINUTES))) {
            throw new \RuntimeException('يجب الحجز قبل الموعد بساعة على الأقل.');
        }
    }

    /**
     * @return array<int, int>
     */
    private function hoursFor(CarbonImmutable $date): array
    {
        return match ($date->dayOfWeek) {
            CarbonImmutable::FRIDAY => [],          // عطلة أسبوعية
            CarbonImmutable::THURSDAY => self::SHORT_HOURS,
            default => self::FULL_HOURS,
        };
    }

    /**
     * مفاتيح الساعات المحجوزة ضمن المدى (Y-m-dTHH).
     *
     * @return array<int, string>
     */
    private function bookedSlots(CarbonImmutable $from, CarbonImmutable $to): array
    {
        return Appointment::query()
            ->where('type', 'meeting')
            ->whereIn('status', ['pending', 'scheduled', 'done'])
            ->whereBetween('start_at', [$from->startOfDay(), $to->endOfDay()])
            ->pluck('start_at')
            ->map(fn ($dt) => $this->slotKey($dt->toDateString(), (int) $dt->format('G')))
            ->all();
    }

    private function slotKey(string $date, int $hour): string
    {
        return $date.'T'.str_pad((string) $hour, 2, '0', STR_PAD_LEFT);
    }

    /** رقم حجز مقروء: MYYMMDD-<id>. */
    private function reference(int $id, CarbonImmutable $slot): string
    {
        return 'M'.$slot->format('ymd').'-'.$id;
    }

    /** الساعة بنظام 12 مع لاحقة عربية. */
    private function hourLabel(int $hour): string
    {
        $suffix = match (true) {
            $hour < 12 => 'صباحًا',
            $hour === 12 => 'ظهرًا',
            $hour < 15 => 'بعد الظهر',
            $hour < 18 => 'عصرًا',
            default => 'مساءً',
        };
        $h12 = $hour === 0 ? 12 : ($hour > 12 ? $hour - 12 : $hour);

        return str_pad((string) $h12, 2, '0', STR_PAD_LEFT).':00 '.$suffix;
    }

    /**
     * يجد جهة الاتصال بالهاتف أو ينشئ عميلًا محتملًا — لا يعدّل عميلًا قائمًا.
     *
     * @param  array<string, mixed>  $data
     */
    private function findOrCreateLead(array $data): Contact
    {
        $phone = (string) ($data['phone'] ?? '');
        $existing = $phone !== '' ? Contact::where('phone', $phone)->first() : null;
        if ($existing) {
            return $existing;
        }

        return Contact::create([
            'full_name' => $data['name'] ?? 'عميل محتمل',
            'phone' => $phone ?: null,
            'email' => $data['email'] ?? null,
            'type' => 'lead',
            'status' => 'active',
            'stage' => 'new',
            'notes' => 'وارد من الموقع الإلكتروني (حجز موعد السعر)',
        ]);
    }
}
