<?php

declare(strict_types=1);

namespace App\Models;

use Spatie\Permission\Models\Role as SpatieRole;

/**
 * دور مخصّص فوق دور spatie — يضيف تحويل عمود settings (إعدادات RBAC الدقيقة) إلى مصفوفة،
 * وعمود dashboard. طلب أيمن 2026-08-13.
 */
class Role extends SpatieRole
{
    /** @var array<string, string> */
    protected $casts = [
        'settings' => 'array',
    ];
}
