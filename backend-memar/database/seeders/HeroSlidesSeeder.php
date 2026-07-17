<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\HeroSlide;
use Illuminate\Database\Seeder;

class HeroSlidesSeeder extends Seeder
{
    public function run(): void
    {
        $slides = [
            [
                'title' => 'مجموعة معمار للاستشارات الهندسية',
                'subtitle' => 'نحوّل رؤيتك إلى تصاميم معمارية استثنائية في الكويت',
                'cta_label' => 'اطلب استشارة',
                'bg_gradient' => 'linear-gradient(135deg, #274A78 0%, #1A3356 100%)',
                'sort_order' => 1,
            ],
            [
                'title' => 'تصميم • إشراف • دراسات جدوى',
                'subtitle' => 'فريق هندسي محترف يرافق مشروعك من الفكرة حتى التسليم',
                'cta_label' => 'خدماتنا',
                'bg_gradient' => 'linear-gradient(135deg, #0F766E 0%, #134E4A 100%)',
                'sort_order' => 2,
            ],
            [
                'title' => 'احصل على عرض سعر فوري',
                'subtitle' => 'محرك تسعير ذكي يعطيك تكلفة مشروعك خلال دقائق',
                'cta_label' => 'احسب التكلفة',
                'bg_gradient' => 'linear-gradient(135deg, #B45309 0%, #7C2D12 100%)',
                'sort_order' => 3,
            ],
        ];

        foreach ($slides as $slide) {
            HeroSlide::firstOrCreate(['title' => $slide['title']], $slide);
        }
    }
}
