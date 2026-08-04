<?php

declare(strict_types=1);

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'phone', 'password', 'is_active', 'contact_id', 'ui_prefs', 'account_number', 'referral_code', 'avatar_file_id'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens;

    use HasFactory;
    use HasRoles;
    use LogsActivity;
    use Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
            'ui_prefs' => 'array',
        ];
    }

    /** سجل العميل المرتبط بهذا الحساب (لبوابة العميل). */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    /** العملاء الذين أحالهم هذا الموظف (لبونص المبيعات). */
    public function referredContacts(): HasMany
    {
        return $this->hasMany(Contact::class, 'referred_by_user_id');
    }

    /** ملف الصورة الشخصية المخزّن (على القرص الخاص). */
    public function avatarFile(): BelongsTo
    {
        return $this->belongsTo(StoredFile::class, 'avatar_file_id');
    }

    /**
     * data URI للصورة الشخصية ليعرضها المتصفّح مباشرةً في <img> (نفس آلية صور العملاء)،
     * دون الحاجة لقرص عام أو نقطة تنزيل محميّة. يرجع null إن لم تُرفع صورة.
     */
    public function avatarDataUri(): ?string
    {
        $file = $this->avatarFile;
        if (! $file || ! Storage::disk($file->disk)->exists($file->path)) {
            return null;
        }

        return 'data:'.($file->mime ?: 'image/jpeg').';base64,'.base64_encode(Storage::disk($file->disk)->get($file->path));
    }

    /**
     * رقم حساب الموظف الثابت: MEM-<السنة>-<تسلسل بثلاث خانات> — يُولّد مرة واحدة.
     * بادئة MEM للطاقم تمييزًا عن MEE للعملاء.
     */
    public function ensureAccountNumber(): string
    {
        if ($this->account_number) {
            return $this->account_number;
        }

        $year = now()->year;
        $prefix = "MEM-{$year}-";

        // آخر تسلسل مستخدم لهذه السنة + 1 (يُحسب في PHP ليعمل على أي قاعدة بيانات).
        $lastSeq = static::query()
            ->where('account_number', 'like', $prefix.'%')
            ->pluck('account_number')
            ->map(fn (string $n): int => (int) substr($n, strlen($prefix)))
            ->max() ?? 0;

        $this->account_number = $prefix.str_pad((string) ($lastSeq + 1), 3, '0', STR_PAD_LEFT);
        $this->save();

        return $this->account_number;
    }

    /**
     * كود إحالة الموظف الثابت: MEMAR-<الاسم الأول باللاتينية><السنة> (مثل MEMAR-AHMED2026)،
     * وإن كان الاسم عربيًا نستخدم التسلسل: MEMAR-<تسلسل>-<السنة>. يُولّد مرة واحدة.
     */
    public function ensureReferralCode(): string
    {
        if ($this->referral_code) {
            return $this->referral_code;
        }

        $year = now()->year;
        // نأخذ أول مقطع في الاسم يعطي حرفين لاتينيين فأكثر (نتخطّى الألقاب مثل «م.» و«د.»).
        $slug = '';
        foreach (Str::of($this->name)->trim()->explode(' ') as $part) {
            $candidate = strtoupper((string) preg_replace('/[^A-Za-z0-9]/', '', Str::ascii((string) $part)));
            if (strlen($candidate) >= 2) { $slug = $candidate; break; }
        }
        $base = $slug !== '' ? "MEMAR-{$slug}{$year}" : 'MEMAR-'.str_pad((string) $this->id, 3, '0', STR_PAD_LEFT)."-{$year}";

        $code = $base;
        $i = 1;
        while (static::where('referral_code', $code)->exists()) {
            $code = "{$base}-{$i}";
            $i++;
        }

        $this->referral_code = $code;
        $this->save();

        return $this->referral_code;
    }

    /**
     * إعدادات سجل التدقيق (activitylog) لهذا النموذج.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'email', 'phone', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
