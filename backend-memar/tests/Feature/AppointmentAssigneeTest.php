<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * الموظف المكلَّف بالموعد/الاجتماع (طلب أيمن 2026-08-31): يُحفظ من النموذج،
 * ويظهر اسمه في القوائم، و«مواعيدي فقط» تُظهر ما يخصّ الموظف وحده.
 */
class AppointmentAssigneeTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, mixed> */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'اجتماع تنسيق مع المقاول',
            'type' => 'meeting',
            'start_at' => '2026-09-03 11:00:00',
        ], $overrides);
    }

    public function test_appointment_is_created_with_an_assignee_and_shows_the_name(): void
    {
        $this->actingAsUserWith(['appointments.view', 'appointments.manage']);
        $employee = User::factory()->create(['name' => 'م. دعاء']);

        $this->postJson('/api/v1/appointments', $this->payload(['assignee_id' => $employee->id]))
            ->assertCreated()
            ->assertJsonPath('data.assignee.name', 'م. دعاء');

        $this->getJson('/api/v1/appointments')
            ->assertOk()
            ->assertJsonPath('data.0.assignee.id', $employee->id)
            ->assertJsonPath('data.0.assignee.name', 'م. دعاء');
    }

    public function test_appointment_without_assignee_reports_null(): void
    {
        $this->actingAsUserWith(['appointments.view', 'appointments.manage']);
        $this->postJson('/api/v1/appointments', $this->payload())->assertCreated();

        $this->getJson('/api/v1/appointments')->assertJsonPath('data.0.assignee', null);
    }

    public function test_mine_shows_only_what_i_am_assigned_not_what_i_created(): void
    {
        $manager = $this->actingAsUserWith(['appointments.view', 'appointments.manage']);
        $employee = User::factory()->create();

        // ① مُسند للموظف   ② سجّله المدير لنفسه   ③ لا يخصّ أيًّا منهما
        $this->postJson('/api/v1/appointments', $this->payload(['title' => 'موعد الموظف', 'assignee_id' => $employee->id]))->assertCreated();
        $this->postJson('/api/v1/appointments', $this->payload(['title' => 'موعد المدير', 'assignee_id' => $manager->id]))->assertCreated();
        Appointment::create([
            'title' => 'موعد غريب', 'type' => 'appointment', 'start_at' => '2026-09-05 09:00:00',
        ]);

        // الكل يرى الثلاثة
        $this->getJson('/api/v1/appointments')->assertOk()->assertJsonCount(3, 'data');

        // «مواعيدي» للمدير: ما كُلّف به وحده — لا ما سجّله لغيره وإن أنشأه بنفسه
        $titles = array_column($this->getJson('/api/v1/appointments?mine=1')->json('data'), 'title');
        $this->assertSame(['موعد المدير'], $titles);
        $this->assertNotContains('موعد الموظف', $titles);
        $this->assertNotContains('موعد غريب', $titles);

        // «مواعيدي» للموظف: ما كُلّف به وحده
        $employee->givePermissionTo('appointments.view');
        $this->actingAs($employee);
        $mine = $this->getJson('/api/v1/appointments?mine=1')->assertOk()->json('data');
        $this->assertCount(1, $mine);
        $this->assertSame('موعد الموظف', $mine[0]['title']);
    }
}
