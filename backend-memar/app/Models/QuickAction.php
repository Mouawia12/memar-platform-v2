<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * اختصار متابعة جاهز يحرّره الأدمن (تم الاتصال/واتساب…). بعضها يُزيل حالة «عاجل».
 */
class QuickAction extends Model
{
    protected $fillable = ['key', 'label', 'icon', 'color', 'clears_urgent', 'position', 'is_active'];

    protected function casts(): array
    {
        return [
            'clears_urgent' => 'boolean',
            'is_active' => 'boolean',
            'position' => 'integer',
        ];
    }
}
