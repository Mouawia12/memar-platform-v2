<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Appointment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * نوع مكان الاجتماع (طلب أيمن 2026-08-30): المكتب · موقع المشروع · أونلاين ·
 * اتصال — حقلٌ مستقلّ يبقى `location` تفصيلَه.
 */
class AppointmentLocationKindTest extends TestCase
{
    use RefreshDatabase;

    public function test_each_location_kind_is_saved_and_returned(): void
    {
        $this->actingAsUserWith(['appointments.view', 'appointments.manage']);

        foreach (Appointment::LOCATION_KINDS as $kind) {
            $this->postJson('/api/v1/appointments', [
                'title' => 'اجتماع العميل',
                'type' => 'meeting',
                'start_at' => '2026-09-01 10:00:00',
                'location_kind' => $kind,
                'location' => 'تفصيل المكان',
            ])->assertCreated()
                ->assertJsonPath('data.location_kind', $kind)
                ->assertJsonPath('data.location', 'تفصيل المكان');
        }
    }

    public function test_an_unknown_kind_is_rejected(): void
    {
        $this->actingAsUserWith(['appointments.view', 'appointments.manage']);

        $this->postJson('/api/v1/appointments', [
            'title' => 'اجتماع', 'type' => 'meeting', 'start_at' => '2026-09-01 10:00:00',
            'location_kind' => 'cafe',
        ])->assertStatus(422);
    }

    public function test_the_kind_is_optional_so_older_appointments_keep_working(): void
    {
        $this->actingAsUserWith(['appointments.view', 'appointments.manage']);

        $this->postJson('/api/v1/appointments', [
            'title' => 'موعد', 'type' => 'appointment', 'start_at' => '2026-09-01 10:00:00',
            'location' => 'المكتب الرئيسي',
        ])->assertCreated()->assertJsonPath('data.location_kind', null);
    }

    public function test_the_kind_can_be_changed_later(): void
    {
        $this->actingAsUserWith(['appointments.view', 'appointments.manage']);
        $appointment = Appointment::create([
            'title' => 'اجتماع', 'type' => 'meeting', 'start_at' => '2026-09-01 10:00:00', 'status' => 'scheduled',
        ]);

        $this->patchJson("/api/v1/appointments/{$appointment->id}", ['location_kind' => 'site'])
            ->assertOk()->assertJsonPath('data.location_kind', 'site');
    }

    public function test_the_list_can_be_filtered_by_appointment_kind(): void
    {
        $this->actingAsUserWith(['appointments.view', 'appointments.manage']);

        Appointment::create(['title' => 'اجتماع المكتب', 'type' => 'appointment', 'status' => 'scheduled', 'start_at' => now(), 'location_kind' => 'office']);
        Appointment::create(['title' => 'زيارة الموقع', 'type' => 'appointment', 'status' => 'scheduled', 'start_at' => now(), 'location_kind' => 'site']);

        $res = $this->getJson('/api/v1/appointments?location_kind=site')->assertOk();

        $this->assertSame(['زيارة الموقع'], array_column($res->json('data'), 'title'));
        $this->assertCount(2, $this->getJson('/api/v1/appointments')->json('data'));
    }
}
