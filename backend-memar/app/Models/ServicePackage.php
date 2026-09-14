<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/** باقة خدمات: خدماتٌ مجمَّعة بسعرٍ واحد أقلّ من مجموعها مفردةً. */
class ServicePackage extends Model
{
    protected $fillable = ['name', 'icon', 'description', 'price_kwd', 'reference_area_sqm', 'is_featured', 'is_active', 'position'];

    protected function casts(): array
    {
        return [
            'price_kwd' => 'decimal:3',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsToMany<Service, $this> */
    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'service_package_items')
            ->withPivot('position')
            ->orderBy('service_package_items.position');
    }

    /**
     * سعر خدمات الباقة مفردةً على مساحتها المرجعية.
     *
     * الخدمة المسعّرة بالمتر تُضرب في المساحة، والمقطوعة تُؤخذ كما هي — وإلّا
     * قُورن «٣٥ د.ك/م²» بسعر باقةٍ بالآلاف فخرج التوفير صفرًا كاذبًا.
     */
    public function itemsTotalKwd(): float
    {
        $area = max(1, (int) $this->reference_area_sqm);

        return round((float) $this->services->sum(
            fn (Service $s): float => (float) $s->price_kwd * ($s->unit === 'م²' ? $area : 1),
        ), 3);
    }

    /**
     * التوفير = سعر الخدمات مفردةً − سعر الباقة. يُحسب ولا يُكتب، فلا يكذب
     * الرقم على العميل إن تغيّر سعر خدمة.
     */
    public function savingsKwd(): float
    {
        return max(0, round($this->itemsTotalKwd() - (float) $this->price_kwd, 3));
    }
}
