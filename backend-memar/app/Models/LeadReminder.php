<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasCardActivity;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * تذكير متابعة على فرصة/عميل. due = حان وقته ولم يُنجَز بعد.
 */
class LeadReminder extends Model
{
    use HasCardActivity; // نفس نشاط بطاقة المهمة: توجيهات وتعليقات وقراءات

    protected $fillable = ['contact_id', 'project_id', 'assignee_id', 'remind_at', 'repeat_every', 'note', 'description', 'done', 'created_by'];

    /**
     * دوريات مسمّاة قديمة — تبقى مقروءةً لأن متابعات محفوظة تحملها.
     * الجديد يُخزَّن وحدةً وعددًا: «5d» خمسة أيام، «2w» أسبوعان، «3m» ثلاثة أشهر
     * (طلب أيمن 2026-08-30) — الوحدة تُحفظ كما اختارها المستخدم لا تُحوَّل أيامًا،
     * كي يقع «كل شهرين» في اليوم نفسه من الشهر لا بعد 60 يومًا.
     */
    public const REPEATS = ['3d' => 3, 'week' => 7, 'month' => 30];

    /** حدّ كل وحدة — ما فوقه ليس «متابعة دوريّة». */
    public const MAX_PER_UNIT = ['d' => 365, 'w' => 52, 'm' => 24];

    /** طول الوحدة بالأيام — تقريبٌ يُستعمل لعدّ الدورات الفائتة وحدها. */
    public const UNIT_DAYS = ['d' => 1, 'w' => 7, 'm' => 30];

    /** نمط الدورية: عدد متبوع بوحدة (d أيام · w أسابيع · m أشهر). */
    public const REPEAT_PATTERN = '/^([1-9][0-9]{0,2})([dwm])$/';

    /** هل القيمة دوريّة مقبولة؟ (مسمّاة قديمة أو «N» + وحدة ضمن حدّها) */
    public static function isValidRepeat(?string $value): bool
    {
        if ($value === null || $value === '') {
            return true;
        }

        return self::repeatParts($value) !== null;
    }

    /**
     * تفكيك الدورية إلى [العدد، الوحدة]، أو null إن لم تكن صالحة.
     *
     * @return array{0: int, 1: string}|null
     */
    public static function repeatParts(?string $value): ?array
    {
        if ($value === null || $value === '') {
            return null;
        }
        // المسمّاة القديمة تُقرأ كأيام بمقدارها المحفوظ.
        if (isset(self::REPEATS[$value])) {
            return [self::REPEATS[$value], 'd'];
        }
        if (preg_match(self::REPEAT_PATTERN, $value, $m) !== 1) {
            return null;
        }
        $count = (int) $m[1];
        $unit = $m[2];

        return $count >= 1 && $count <= self::MAX_PER_UNIT[$unit] ? [$count, $unit] : null;
    }

    /** مقدار الدورية بالأيام تقريبًا (لعدّ الدورات الفائتة)، أو null. */
    public static function repeatDays(?string $value): ?int
    {
        $parts = self::repeatParts($value);

        return $parts === null ? null : $parts[0] * self::UNIT_DAYS[$parts[1]];
    }

    /**
     * موعد الدورة التالية بعد $from بوحدة الدورية نفسها.
     * الأشهر تُضاف كأشهر تقويمية لا 30 يومًا، فتقع في اليوم نفسه من الشهر.
     */
    public static function nextOccurrence(?string $value, CarbonInterface $from): ?CarbonInterface
    {
        $parts = self::repeatParts($value);
        if ($parts === null) {
            return null;
        }
        [$count, $unit] = $parts;
        $next = $from->copy();

        return match ($unit) {
            'w' => $next->addWeeks($count),
            // NoOverflow يمنع قفز 31 يناير إلى 3 مارس: شهرٌ من 31 يناير = 28 فبراير.
            'm' => $next->addMonthsNoOverflow($count),
            default => $next->addDays($count),
        };
    }

    protected function casts(): array
    {
        return [
            'remind_at' => 'datetime',
            'done' => 'boolean',
        ];
    }

    /** @return BelongsTo<Contact, $this> */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * صاحب بطاقة المتابعة: المكلَّف بها إن حُدِّد، وإلّا مَن أنشأها (متابعات
     * قديمة بلا مكلَّف). وهو نفسه معيار «متابعاتي فقط» في اللوحة، فلا يختلف
     * معنى «لي» بين الفلتر والتمييز.
     */
    public function activityOwnerId(): ?int
    {
        return $this->assignee_id ?? $this->created_by;
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** المشروع المرتبط بالمتابعة (اختياري). */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    /** المكلَّف بالمتابعة — صاحب بطاقتها في «متابعاتي فقط». */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }
}
