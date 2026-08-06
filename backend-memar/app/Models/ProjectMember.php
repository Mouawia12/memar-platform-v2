<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * محور إسناد موظف إلى مشروع (project_members) — يحمل دور الموظف داخل المشروع،
 * ومن أسنده، ومتى، وآخر مرة فتحه (last_seen_at) لتمييز «الجديد».
 */
class ProjectMember extends Pivot
{
    protected $table = 'project_members';

    public $incrementing = true;

    protected $casts = [
        'assigned_at' => 'datetime',
        'last_seen_at' => 'datetime',
    ];
}
