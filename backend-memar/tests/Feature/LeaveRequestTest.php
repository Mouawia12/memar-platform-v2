<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** وحدة إجازات الموظف — خدمة ذاتية (اجتماع 2026-08-07، بند 12). */
class LeaveRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_submit_a_leave_request_with_computed_days(): void
    {
        $this->actingAsUserWith([]);
        $res = $this->postJson('/api/v1/leaves', [
            'type' => 'annual', 'from_date' => '2026-09-01', 'to_date' => '2026-09-05', 'reason' => 'إجازة عائلية',
        ])->assertCreated();

        $this->assertSame(5, $res->json('data.days')); // شامل الطرفين
        $this->assertDatabaseHas('leave_requests', ['type' => 'annual', 'days' => 5, 'status' => 'pending']);
    }

    public function test_mine_returns_only_own_requests(): void
    {
        $me = $this->actingAsUserWith([]);
        $other = User::factory()->create();
        LeaveRequest::create(['user_id' => $me->id, 'type' => 'annual', 'from_date' => '2026-09-01', 'to_date' => '2026-09-02', 'days' => 2, 'status' => 'pending']);
        LeaveRequest::create(['user_id' => $other->id, 'type' => 'annual', 'from_date' => '2026-09-01', 'to_date' => '2026-09-02', 'days' => 2, 'status' => 'pending']);

        $this->getJson('/api/v1/leaves/mine')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_balance_deducts_only_approved_annual_days(): void
    {
        $me = $this->actingAsUserWith([]);
        LeaveRequest::create(['user_id' => $me->id, 'type' => 'annual', 'from_date' => '2026-06-01', 'to_date' => '2026-06-03', 'days' => 3, 'status' => 'approved']);
        LeaveRequest::create(['user_id' => $me->id, 'type' => 'annual', 'from_date' => '2026-07-01', 'to_date' => '2026-07-02', 'days' => 2, 'status' => 'pending']); // معلّق لا يُحتسب

        $res = $this->getJson('/api/v1/leaves/balance')->assertOk();
        $this->assertSame(3, $res->json('data.annual_used'));
        $this->assertSame((int) config('hr.leave.annual') - 3, $res->json('data.annual_remaining'));
    }

    public function test_leave_request_rejects_reversed_dates(): void
    {
        $this->actingAsUserWith([]);
        $this->postJson('/api/v1/leaves', ['type' => 'annual', 'from_date' => '2026-09-05', 'to_date' => '2026-09-01'])
            ->assertStatus(422);
    }
}
