<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $fillable = ['key', 'value'];

    /** الحقول المسموح بها + قيمها الافتراضية. */
    public const DEFAULTS = [
        'site_name' => 'مجموعة معمار للاستشارات الهندسية',
        'tagline' => 'نحوّل رؤيتك إلى تصاميم معمارية استثنائية',
        'about' => 'مكتب استشارات هندسية في الكويت متخصّص في التصميم المعماري والإشراف الهندسي ودراسات الجدوى.',
        'phone' => '+965 0000 0000',
        'email' => 'info@memar.com.kw',
        'address' => 'الكويت',
        'whatsapp' => '96500000000',
        'working_hours' => 'الأحد - الخميس، 8ص - 4م',
        'facebook' => '',
        'instagram' => '',
        'twitter' => '',
    ];

    /**
     * كل الإعدادات كخريطة key=>value مع دمج القيم الافتراضية.
     *
     * @return array<string, string>
     */
    public static function map(): array
    {
        $stored = self::query()->pluck('value', 'key')->all();

        return array_merge(self::DEFAULTS, array_filter($stored, fn ($v) => $v !== null));
    }
}
