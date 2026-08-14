<?php

declare(strict_types=1);

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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

    /**
     * المشاريع المُسنَدة لهذا الموظف («مشاريعي») — many-to-many مع محور الإسناد.
     *
     * @return BelongsToMany<Project, $this>
     */
    public function assignedProjects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_members')
            ->using(ProjectMember::class)
            ->withPivot(['role_on_project', 'assigned_by', 'assigned_at', 'last_seen_at'])
            ->withTimestamps();
    }

    /**
     * النطاق الفعّال للمشاريع من إعدادات RBAC لأدوار المستخدم (all/partial/assigned/own).
     *
     * الأدمن والمدير العام يريان الكل دائمًا. الإنفاذ يتبع ما ضُبط صراحةً: دور بلا إعدادات
     * محفوظة ⇒ «all» (لا كسر للسلوك الحالي)، وبمجرد ضبط الدور على «assigned» في شاشة RBAC
     * يُقصر المستخدم على مشاريعه المُسنَدة. عند تعدّد الأدوار نأخذ الأوسع.
     */
    public function rbacProjectScope(): string
    {
        $rank = ['own' => 0, 'assigned' => 1, 'department' => 2, 'partial' => 2, 'all' => 3];
        $best = null;

        foreach ($this->roles as $role) {
            if (in_array($role->name, ['super_admin', 'admin'], true)) {
                return 'all';
            }
            $scope = data_get($role->getAttribute('settings'), 'scope.projects');
            if (is_string($scope) && ($best === null || ($rank[$scope] ?? 0) > ($rank[$best] ?? 0))) {
                $best = $scope;
            }
        }

        return $best ?? 'all';
    }

    /**
     * أنواع الحسابات المسموح لهذا المستخدم التواصل معها ('all' = بلا قيود).
     * مثل النطاق: دور بلا إعدادات محفوظة أو يتضمّن «all» ⇒ بلا قيود. عند التعدّد نأخذ الاتحاد.
     *
     * @return array<int, string>
     */
    public function rbacChatTypes(): array
    {
        $union = [];
        $anyStored = false;

        foreach ($this->roles as $role) {
            if (in_array($role->name, ['super_admin', 'admin'], true)) {
                return ['all'];
            }
            $types = data_get($role->getAttribute('settings'), 'chat.types');
            if (is_array($types)) {
                $anyStored = true;
                if (in_array('all', $types, true)) {
                    return ['all'];
                }
                $union = array_merge($union, array_values(array_filter($types, 'is_string')));
            }
        }

        return $anyStored ? array_values(array_unique($union)) : ['all'];
    }

    /** هل يسمح دور هذا المستخدم بمخاطبة الطرف الآخر (حسب نوع حسابه)؟ */
    public function canChatWith(self $target): bool
    {
        $types = $this->rbacChatTypes();
        if (in_array('all', $types, true)) {
            return true;
        }

        $targetType = $target->contact_id !== null
            ? 'clients'
            : ($target->hasAnyRole(['super_admin', 'admin']) ? 'management' : 'employees');

        return in_array($targetType, $types, true);
    }

    /** إشعارات التطبيق لهذا المستخدم (جرس التوب‌بار). */
    public function appNotifications(): HasMany
    {
        return $this->hasMany(AppNotification::class)->latest();
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
