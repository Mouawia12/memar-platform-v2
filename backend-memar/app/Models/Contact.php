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
        'full_name', 'kunya', 'email', 'phone', 'company', 'position',
        'type', 'status', 'stage', 'temperature', 'deal_value_kwd', 'owner_id', 'notes',
        'project_name', 'project_details', 'converted_project_id', 'notification_prefs',
        'referral_code', 'referral_shares',
    ];

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
