<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\FieldVisit;
use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * بوابة المهندس — الأداء الشخصي وأجندة اليوم الموحّدة (تحسين 2026-08-04).
 */
class EngineerPortalTest extends TestCase
{
    use RefreshDatabase;

    public function test_performance_block_reflects_the_users_tasks(): void
    {
        $user = $this->actingAsUserWith([]);

        // 3 منجزة (منها واحدة في الموعد، وواحدة متأخرة، وواحدة بلا تاريخ) + 2 مفتوحة.
        Task::create(['title' => 'منجزة في الموعد', 'assignee_id' => $user->id, 'status' => 'done', 'due_date' => today()->addDay(), 'position' => 0]);
        Task::create(['title' => 'منجزة متأخرة', 'assignee_id' => $user->id, 'status' => 'done', 'due_date' => '2020-01-01', 'position' => 0]);
        Task::create(['title' => 'منجزة بلا تاريخ', 'assignee_id' => $user->id, 'status' => 'done', 'position' => 0]);
        Task::create(['title' => 'مفتوحة 1', 'assignee_id' => $user->id, 'status' => 'todo', 'position' => 0]);
        Task::create(['title' => 'مفتوحة 2', 'assignee_id' => $user->id, 'status' => 'in_progress', 'position' => 0]);

        $this->getJson('/api/v1/engineer-portal')
            ->assertOk()
            ->assertJsonPath('data.performance.done_total', 3)
            ->assertJsonPath('data.performance.done_this_week', 3)
            ->assertJsonPath('data.performance.completion_rate', 60) // 3 / (3+2)
            ->assertJsonPath('data.performance.on_time_rate', 50); // 1 من 2 لها تاريخ
    }

    public function test_today_agenda_merges_tasks_visits_and_appointments_sorted_by_time(): void
    {
        $user = $this->actingAsUserWith([]);

        Task::create(['title' => 'مهمة مستحقّة اليوم', 'assignee_id' => $user->id, 'status' => 'todo', 'due_date' => today(), 'position' => 0]);
        FieldVisit::create(['title' => 'زيارة موقع', 'engineer_id' => $user->id, 'type' => 'inspection', 'status' => 'scheduled', 'visit_date' => today()->setTime(9, 0), 'created_by' => $user->id]);
        Appointment::create(['title' => 'اجتماع عميل', 'type' => 'meeting', 'status' => 'scheduled', 'start_at' => today()->setTime(14, 30), 'created_by' => $user->id]);

        $res = $this->getJson('/api/v1/engineer-portal')->assertOk()->assertJsonCount(3, 'data.today');

        $kinds = collect($res->json('data.today'))->pluck('kind')->all();
        $this->assertEqualsCanonicalizing(['task', 'visit', 'appointment'], $kinds);

        // العناصر ذات الوقت مرتّبة تصاعديًا (09:00 قبل 14:30)؛ المهمة (بلا وقت) في الآخر.
        $times = collect($res->json('data.today'))->pluck('time')->filter()->values()->all();
        $this->assertSame(['09:00', '14:30'], $times);
    }

    public function test_today_agenda_ignores_other_users_and_cancelled(): void
    {
        $user = $this->actingAsUserWith([]);
        $other = \App\Models\User::factory()->create();

        FieldVisit::create(['title' => 'زيارة ملغاة', 'engineer_id' => $user->id, 'type' => 'inspection', 'status' => 'cancelled', 'visit_date' => today(), 'created_by' => $user->id]);
        Appointment::create(['title' => 'موعد شخص آخر', 'type' => 'meeting', 'status' => 'scheduled', 'start_at' => today()->setTime(10, 0), 'created_by' => $other->id]);

        $this->getJson('/api/v1/engineer-portal')->assertOk()->assertJsonCount(0, 'data.today');
    }
}
