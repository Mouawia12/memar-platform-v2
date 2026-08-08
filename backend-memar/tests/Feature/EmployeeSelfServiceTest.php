<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Salary;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * الخدمة الذاتية للموظف (بلا صلاحية hr): سجل حضوره الشهري وكشوف راتبه — تُغذّي
 * صفحتَي «الحضور» و«كشف الراتب» في بوابة الموظف. اجتماع 2026-08-07 (بند 12).
 */
class EmployeeSelfServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_attendance_mine_returns_only_current_user_records(): void
    {
        $me = $this->actingAsUserWith([]);
        $other = User::factory()->create();
        Attendance::create(['user_id' => $me->id, 'date' => '2026-08-07', 'status' => 'present', 'work_minutes' => 480, 'method' => 'manual']);
        Attendance::create(['user_id' => $me->id, 'date' => '2026-08-06', 'status' => 'late', 'work_minutes' => 450, 'method' => 'manual']);
        Attendance::create(['user_id' => $other->id, 'date' => '2026-08-07', 'status' => 'present', 'work_minutes' => 480, 'method' => 'manual']);

        $res = $this->getJson('/api/v1/attendance/mine')->assertOk();
        $this->assertCount(2, $res->json('data')); // سجلّي فقط، لا سجلّ الآخر
    }

    public function test_attendance_mine_summary_counts_current_user_only(): void
    {
        $me = $this->actingAsUserWith([]);
        $other = User::factory()->create();
        Attendance::create(['user_id' => $me->id, 'date' => '2026-08-07', 'status' => 'present', 'work_minutes' => 480, 'method' => 'manual']);
        Attendance::create(['user_id' => $me->id, 'date' => '2026-08-06', 'status' => 'late', 'work_minutes' => 450, 'method' => 'manual']);
        Attendance::create(['user_id' => $other->id, 'date' => '2026-08-07', 'status' => 'present', 'work_minutes' => 480, 'method' => 'manual']);

        $res = $this->getJson('/api/v1/attendance/mine/summary')->assertOk();
        $this->assertSame(1, $res->json('data.present'));
        $this->assertSame(1, $res->json('data.late'));
    }

    public function test_salaries_mine_returns_only_own_employee_salaries(): void
    {
        $me = $this->actingAsUserWith([]);
        $emp = Employee::factory()->create(['user_id' => $me->id]);
        $otherEmp = Employee::factory()->create();
        Salary::create(['employee_id' => $emp->id, 'month' => '2026-08', 'base_kwd' => 1200, 'allowances_kwd' => 380, 'deductions_kwd' => 86, 'net_kwd' => 1494, 'status' => 'paid']);
        Salary::create(['employee_id' => $otherEmp->id, 'month' => '2026-08', 'base_kwd' => 900, 'allowances_kwd' => 0, 'deductions_kwd' => 0, 'net_kwd' => 900, 'status' => 'paid']);

        $res = $this->getJson('/api/v1/salaries/mine')->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertSame('2026-08', $res->json('data.0.month'));
    }

    public function test_salaries_mine_empty_without_linked_employee(): void
    {
        $this->actingAsUserWith([]);
        $this->getJson('/api/v1/salaries/mine')->assertOk()->assertJsonCount(0, 'data');
    }
}
