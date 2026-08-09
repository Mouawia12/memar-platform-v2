<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Attendance;
use App\Models\LoyaltyTransaction;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * بيانات لوحة الموظف (م. دعاء / arch1) — مهام + حضور + مواعيد اليوم + نقاط إحالة،
 * لتوضيح تصميم «نظرة عامة» ببيانات حيّة. idempotent. يعمل بعد DemoUsersSeeder. طلب أيمن 2026-08-09.
 */
class EmployeeDashboardSeeder extends Seeder
{
    public function run(): void
    {
        $emp = User::where('email', 'arch1@memar.kw')->first();
        if ($emp === null) {
            return;
        }
        $adminId = User::where('email', 'admin@memar.kw')->value('id') ?? $emp->id;
        $projects = Project::orderBy('id')->take(3)->get();
        $proj = fn (int $i): ?int => $projects[$i]->id ?? null;

        // ── مهام مسندة للموظف (متأخر/اليوم/قادم/مكتمل) ──
        $tasks = [
            ['مراجعة مخططات الواجهة', 'urgent', 'todo', today(), 0],
            ['متابعة ملاحظات العميل على الواجهة', 'high', 'todo', today()->subDay(), 1], // متأخر
            ['تحديث BIM Model — الطابق الثالث', 'high', 'in_progress', today()->addDay(), 1],
            ['إعداد عرض تقديمي للعميل', 'medium', 'todo', today()->addDays(2), 2],
            ['رفع مخططات الإنشائي للمراجعة', 'medium', 'done', today()->subDays(2), 0],
        ];
        foreach ($tasks as [$title, $priority, $status, $due, $pi]) {
            Task::updateOrCreate(
                ['assignee_id' => $emp->id, 'title' => $title],
                ['project_id' => $proj($pi), 'created_by' => $adminId, 'status' => $status, 'priority' => $priority, 'due_date' => $due->toDateString()],
            );
        }

        // ── حضور الشهر (أيام عمل ماضية) ──
        for ($i = 0; $i < 24; $i++) {
            $date = today()->subDays($i);
            if ($date->isFriday() || $date->isSaturday()) {
                continue;
            }
            $late = $i % 7 === 3;
            Attendance::updateOrCreate(
                ['user_id' => $emp->id, 'date' => $date->toDateString()],
                [
                    'status' => $late ? 'late' : 'present',
                    'check_in_at' => $date->copy()->setTime($late ? 8 : 7, $late ? 40 : 58),
                    'check_out_at' => $i === 0 ? null : $date->copy()->setTime(16, 30),
                    'work_minutes' => $i === 0 ? 0 : 510,
                    'method' => 'manual',
                ],
            );
        }

        // ── مواعيد اليوم ──
        $appts = [
            ['اجتماع مراجعة أسبوعي', today()->copy()->setTime(9, 0), 'قاعة المؤتمرات A', 'scheduled', 0],
            ['زيارة موقع — مبنى العليا', today()->copy()->setTime(11, 0), 'موقع المشروع', 'scheduled', 1],
            ['عرض تصميم للعميل', today()->copy()->setTime(14, 0), 'غرفة العروض', 'pending', 2],
        ];
        foreach ($appts as [$title, $start, $loc, $status, $pi]) {
            Appointment::updateOrCreate(
                ['title' => $title, 'start_at' => $start],
                ['type' => 'meeting', 'project_id' => $proj($pi), 'end_at' => $start->copy()->addHour(), 'location' => $loc, 'is_video' => false, 'status' => $status, 'created_by' => $adminId],
            );
        }

        // ── نقاط إحالة (لإظهار الكرت والـKPI) ──
        if (LoyaltyTransaction::where('user_id', $emp->id)->where('source', 'referral_contracted')->doesntExist()) {
            $bal = 0;
            foreach ([200, 150, 100] as $pts) {
                $bal += $pts;
                LoyaltyTransaction::create(['user_id' => $emp->id, 'contact_id' => null, 'points' => $pts, 'balance_after' => $bal, 'source' => 'referral_contracted', 'description' => 'نقاط إحالة: عميل تعاقد عبر كودك']);
            }
        }
    }
}
