<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'is_active' => $this->is_active,
            'contact_id' => $this->contact_id,
            'contact_name' => $this->contact?->full_name,
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            // هوية الموظف/المهندس لبطاقة الشريط الجانبي (اجتماع 2026-08-03): رقم حساب ثابت + كود إحالة + عدد العملاء المُحالين.
            'account_number' => $this->resource->ensureAccountNumber(),
            'referral_code' => $this->resource->ensureReferralCode(),
            'referred_clients' => $this->referredContacts()->count(),
            'avatar_url' => $this->resource->avatarDataUri(),
            'roles' => $this->getRoleNames(),
            // نوع اللوحة التي يهبط عليها المستخدم حسب أعلى أدواره (أدمن > موظف > عميل).
            // يُوجّه إليها الدخول والحرّاس بدل الاعتماد على أسماء الأدوار. طلب أيمن 2026-08-12.
            'dashboard' => $this->resolveDashboard(),
            'permissions' => $this->getAllPermissions()->pluck('name'),
            // تفضيلات القائمة الجانبية (المخفي/المطوي) — تُحمَّل عند الدخول لتبقى ثابتة عبر الأجهزة.
            'ui_prefs' => $this->ui_prefs ?? (object) [],
            // أقسام/عناصر السايدبار المخفية حسب دور المستخدم (يضبطها الأدمن لكل دور) — طلب أيمن 2026-08-17.
            'role_nav_hidden' => $this->computeRoleNavHidden(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * أقسام/عناصر السايدبار المخفية للمستخدم = المخفية لدى كل أدواره (تقاطع): يظهر العنصر إن أظهره أيّ دور.
     *
     * @return array<int, string>
     */
    private function computeRoleNavHidden(): array
    {
        $lists = $this->resource->roles
            ->map(fn ($r): array => array_values(array_filter(
                (array) (($r->getAttribute('settings')['nav_hidden'] ?? [])),
                'is_string',
            )))
            ->all();

        if ($lists === []) {
            return [];
        }

        $hidden = array_shift($lists);
        foreach ($lists as $list) {
            $hidden = array_intersect($hidden, $list);
        }

        return array_values($hidden);
    }

    /** أعلى نوع لوحة بين أدوار المستخدم (أدمن > موظف > عميل)؛ الافتراضي موظف. */
    private function resolveDashboard(): string
    {
        // احتياط للأدوار النظامية إن لم يُضبط عمود dashboard بعد.
        $systemMap = ['super_admin' => 'admin', 'admin' => 'admin', 'employee' => 'employee', 'client' => 'client'];
        $priority = ['admin' => 3, 'employee' => 2, 'client' => 1];

        $best = null;
        $bestScore = -1;
        foreach ($this->roles as $role) {
            $d = $systemMap[$role->name] ?? ($role->getAttribute('dashboard') ?: 'employee');
            if (($priority[$d] ?? 0) > $bestScore) {
                $bestScore = $priority[$d] ?? 0;
                $best = $d;
            }
        }

        return $best ?? 'employee';
    }
}
