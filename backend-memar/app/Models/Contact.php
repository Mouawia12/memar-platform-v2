<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ContactFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Contact extends Model
{
    /** @use HasFactory<ContactFactory> */
    use HasFactory;

    use LogsActivity;
    use SoftDeletes;

    protected $fillable = [
        'full_name', 'kunya', 'email', 'phone', 'company', 'head_office', 'company_about', 'position',
        'type', 'status', 'stage', 'temperature', 'deal_value_kwd', 'owner_id', 'notes',
        'project_name', 'project_details', 'converted_project_id', 'notification_prefs',
        'referral_code', 'referral_shares', 'account_number', 'avatar_file_id', 'referred_by_user_id',
        'referred_by_contact_id', 'loyalty_points', 'loyalty_points_lifetime',
    ];

    /**
     * الصورة الشخصية للعميل — ملف مخزّن على القرص الخاص (اجتماع 2026-08-03، بند 10).
     *
     * @return BelongsTo<StoredFile, $this>
     */
    public function avatarFile(): BelongsTo
    {
        return $this->belongsTo(StoredFile::class, 'avatar_file_id');
    }

    /**
     * يضمن وجود رقم حساب شخصي ثابت بصيغة MEE-<السنة>-<تسلسل> (اجتماع 2026-08-03).
     * يُولَّد مرة واحدة ولا يتغيّر — بخلاف كود الإحالة المتغيّر.
     */
    public function ensureAccountNumber(): string
    {
        if ($this->account_number) {
            return $this->account_number;
        }

        $year = now()->year;
        $prefix = "MEE-{$year}-";

        // آخر تسلسل مستخدم لهذه السنة + 1 (يُحسب في PHP ليعمل على أي قاعدة بيانات)
        $lastSeq = static::withTrashed()
            ->where('account_number', 'like', $prefix.'%')
            ->pluck('account_number')
            ->map(fn (string $n): int => (int) substr($n, strlen($prefix)))
            ->max() ?? 0;

        $this->account_number = $prefix.str_pad((string) ($lastSeq + 1), 3, '0', STR_PAD_LEFT);
        $this->save();

        return $this->account_number;
    }

    /** تفضيلات الإشعارات الافتراضية (الكل مفعّل) حين لا يوجد تخصيص محفوظ. */
    public const DEFAULT_NOTIFICATION_PREFS = [
        'email' => true,
        'sms' => true,
        'meetings' => true,
        'invoices' => true,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'deal_value_kwd' => 'decimal:3',
            'notification_prefs' => 'array',
            'loyalty_points' => 'integer',
            'loyalty_points_lifetime' => 'integer',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * المشروع المتولّد بعد فوز الفرصة — هو مصدر الحقيقة الوحيد لاسم/رقم المشروع.
     * بمجرّد الربط، الاسم يُقرأ من سجل المشاريع (حيّ) فيبقى موحّدًا في كل مكان.
     */
    public function convertedProject(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'converted_project_id');
    }

    /**
     * @return HasMany<Referral, $this>
     */
    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class, 'referrer_contact_id');
    }

    /** حركات نقاط الولاء (السجل) — الأحدث أولًا. @return HasMany<LoyaltyTransaction, $this> */
    public function loyaltyTransactions(): HasMany
    {
        return $this->hasMany(LoyaltyTransaction::class);
    }

    /** قسائم الاستبدال (نقاط → رصيد خصم). @return HasMany<LoyaltyRedemption, $this> */
    public function loyaltyRedemptions(): HasMany
    {
        return $this->hasMany(LoyaltyRedemption::class);
    }

    /** العميل الذي أحال هذا العميل (عميل↔عميل). @return BelongsTo<Contact, $this> */
    public function referredByContact(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'referred_by_contact_id');
    }

    /** تذكيرات المتابعة على الفرصة/العميل. @return HasMany<LeadReminder, $this> */
    public function reminders(): HasMany
    {
        return $this->hasMany(LeadReminder::class);
    }

    /**
     * اسم المشروع الموحّد: اسم المشروع الحيّ من سجل المشاريع إن وُجد،
     * وإلا الاسم المبدئي المُدخل في الفرصة قبل التحويل.
     */
    protected function effectiveProjectName(): Attribute
    {
        return Attribute::make(
            get: fn (): ?string => $this->convertedProject?->name ?? $this->project_name,
        );
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['full_name', 'email', 'phone', 'company', 'type', 'status', 'stage', 'temperature', 'deal_value_kwd'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
