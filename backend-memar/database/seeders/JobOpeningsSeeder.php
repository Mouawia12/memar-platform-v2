<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\JobOpening;
use Illuminate\Database\Seeder;

class JobOpeningsSeeder extends Seeder
{
    public function run(): void
    {
        $jobs = [
            ['title' => 'مهندس معماري', 'department' => 'التصميم', 'employment_type' => 'full_time', 'location' => 'في المكتب', 'description' => 'تصميم الواجهات والمخططات المعمارية للمشاريع السكنية والتجارية مع فريق إبداعي متميز.', 'status' => 'open'],
            ['title' => 'مهندس إنشائي', 'department' => 'الإنشاء', 'employment_type' => 'full_time', 'location' => 'في المكتب', 'description' => 'إعداد المخططات الإنشائية وحساب الكميات والأحمال الهندسية للمباني.', 'status' => 'open'],
            ['title' => 'مصمم داخلي 3D', 'department' => 'التصميم', 'employment_type' => 'full_time', 'location' => 'هجين', 'description' => 'تصميم الديكورات الداخلية وإنتاج صور ثلاثية الأبعاد عالية الجودة.', 'status' => 'open'],
            ['title' => 'محاسب', 'department' => 'المالية', 'employment_type' => 'full_time', 'location' => 'في المكتب', 'description' => 'إدارة الحسابات المالية والفواتير والتقارير الشهرية للمكتب.', 'status' => 'open'],
            ['title' => 'سكرتير/ة تنفيذي/ة', 'department' => 'الإدارة', 'employment_type' => 'full_time', 'location' => 'في المكتب', 'description' => 'تنظيم المواعيد والمراسلات وإدارة المكتب والتواصل مع العملاء.', 'status' => 'open'],
            ['title' => 'مندوب مبيعات', 'department' => 'المبيعات', 'employment_type' => 'full_time', 'location' => 'في المكتب', 'description' => 'التواصل مع العملاء المحتملين وتقديم خدمات المكتب الهندسية.', 'status' => 'closed'],
        ];

        foreach ($jobs as $job) {
            JobOpening::firstOrCreate(['title' => $job['title']], $job);
        }
    }
}
