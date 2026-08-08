<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\DailyReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** وحدة التقارير اليومية للموظف — خدمة ذاتية (اجتماع 2026-08-07، بند 12). */
class DailyReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_submit_a_daily_report(): void
    {
        $this->actingAsUserWith([]);
        $this->postJson('/api/v1/daily-reports', [
            'accomplished' => 'أنجزت مراجعة المخططات', 'tomorrow_plan' => 'زيارة الموقع',
        ])->assertCreated();

        $this->assertDatabaseHas('daily_reports', ['accomplished' => 'أنجزت مراجعة المخططات', 'status' => 'submitted']);
    }

    public function test_report_requires_accomplished_text(): void
    {
        $this->actingAsUserWith([]);
        $this->postJson('/api/v1/daily-reports', ['challenges' => 'x'])->assertStatus(422);
    }

    public function test_mine_returns_only_own_reports(): void
    {
        $me = $this->actingAsUserWith([]);
        $other = User::factory()->create();
        DailyReport::create(['user_id' => $me->id, 'report_date' => '2026-08-07', 'accomplished' => 'تقريري', 'status' => 'submitted']);
        DailyReport::create(['user_id' => $other->id, 'report_date' => '2026-08-07', 'accomplished' => 'تقرير غيري', 'status' => 'submitted']);

        $this->getJson('/api/v1/daily-reports/mine')->assertOk()->assertJsonCount(1, 'data');
    }
}
