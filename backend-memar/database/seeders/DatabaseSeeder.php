<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // كل السيدرات الأساسية — آمنة للتكرار (firstOrCreate / updateOrCreate)
        $this->call([
            RolesAndAdminSeeder::class,   // الصلاحيات + الأدوار + مستخدم الأدمن
            HeroSlidesSeeder::class,      // شرائح كاروسيل الصفحة الرئيسية
            JobOpeningsSeeder::class,     // الوظائف المعروضة في صفحة /jobs
        ]);
    }
}
