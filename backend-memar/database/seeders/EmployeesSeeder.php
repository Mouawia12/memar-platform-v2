<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * فريق معمار الحقيقي (HR) — بيانات موظفين واقعية مرتبطة بحسابات الطاقم.
 * آمن للتكرار (firstOrCreate بالاسم) ولا يكرّر السجلات. يُستدعى من DatabaseSeeder.
 */
class EmployeesSeeder extends Seeder
{
    public function run(): void
    {
        // البريد يربط الموظف بحساب المستخدم إن وُجد (user_id)، وإلا يبقى null.
        $roster = [
            ['full_name' => 'م. أيمن الطوخي', 'job_title' => 'المدير العام', 'department' => 'الإدارة', 'base_salary_kwd' => 2500, 'hire_date' => '2019-01-06', 'email' => 'admin@memar.kw'],
            ['full_name' => 'م. عبدالله الفهد', 'job_title' => 'مدير مشاريع', 'department' => 'الإدارة', 'base_salary_kwd' => 1200, 'hire_date' => '2021-03-14', 'email' => 'pm@memar.kw'],
            ['full_name' => 'م. دعاء السالم', 'job_title' => 'مهندسة معمارية', 'department' => 'التصميم', 'base_salary_kwd' => 950, 'hire_date' => '2022-05-23', 'email' => 'arch1@memar.kw'],
            ['full_name' => 'م. خالد العنزي', 'job_title' => 'مهندس معماري', 'department' => 'التصميم', 'base_salary_kwd' => 900, 'hire_date' => '2023-02-01', 'email' => 'arch2@memar.kw'],
            ['full_name' => 'م. إسماعيل خالد', 'job_title' => 'مهندس إنشائي', 'department' => 'الإنشاء', 'base_salary_kwd' => 950, 'hire_date' => '2022-09-10', 'email' => 'struct1@memar.kw'],
            ['full_name' => 'م. بيشوي سمير', 'job_title' => 'مهندس إنشائي', 'department' => 'الإنشاء', 'base_salary_kwd' => 850, 'hire_date' => '2023-06-18', 'email' => 'struct2@memar.kw'],
            ['full_name' => 'أ. وليد ناصر', 'job_title' => 'محاسب', 'department' => 'المالية', 'base_salary_kwd' => 750, 'hire_date' => '2021-11-02', 'email' => 'acc@memar.kw'],
            ['full_name' => 'أ. رنا مبارك', 'job_title' => 'سكرتيرة تنفيذية', 'department' => 'الإدارة', 'base_salary_kwd' => 600, 'hire_date' => '2023-01-15', 'email' => 'sec@memar.kw'],
            ['full_name' => 'مندوب أبو علي', 'job_title' => 'مندوب معاملات', 'department' => 'العمليات', 'base_salary_kwd' => 550, 'hire_date' => '2023-04-09', 'email' => 'rep@memar.kw'],
            ['full_name' => 'رسّام نشأت', 'job_title' => 'رسّام (أوتوكاد)', 'department' => 'التصميم', 'base_salary_kwd' => 650, 'hire_date' => '2022-12-05', 'email' => 'draft@memar.kw'],
        ];

        foreach ($roster as $row) {
            $userId = User::where('email', $row['email'])->value('id');

            Employee::firstOrCreate(
                ['full_name' => $row['full_name']],
                [
                    'user_id' => $userId,
                    'job_title' => $row['job_title'],
                    'department' => $row['department'],
                    'hire_date' => $row['hire_date'],
                    'base_salary_kwd' => $row['base_salary_kwd'],
                    'phone' => '9'.random_int(1000000, 9999999),
                    'status' => 'active',
                ],
            );
        }
    }
}
