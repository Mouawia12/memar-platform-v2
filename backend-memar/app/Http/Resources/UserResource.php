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
            'roles' => $this->getRoleNames(),
            'permissions' => $this->getAllPermissions()->pluck('name'),
            // تفضيلات القائمة الجانبية (المخفي/المطوي) — تُحمَّل عند الدخول لتبقى ثابتة عبر الأجهزة.
            'ui_prefs' => $this->ui_prefs ?? (object) [],
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
