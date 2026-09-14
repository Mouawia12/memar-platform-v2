<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\LeadReminder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * دورية المتابعة يحدّدها المستخدم بعدد أيام حرّ («5d»، «12d») بدل ثلاث دوريات
 * ثابتة (طلب أيمن 2026-08-29)، مع بقاء المسمّاة القديمة مقروءة.
 */
class FollowUpCustomRepeatTest extends TestCase
{
    use RefreshDatabase;

    private function makeContact(): Contact
    {
        return Contact::create(['full_name' => 'شركة الفهد', 'type' => 'lead', 'stage' => 'new']);
    }

    private function makeReminder(Contact $c, string $repeat, string $at): LeadReminder
    {
        return $c->reminders()->create(['remind_at' => $at, 'repeat_every' => $repeat]);
    }

    public function test_a_custom_day_interval_is_accepted(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $contact = $this->makeContact();

        $this->postJson("/api/v1/contacts/{$contact->id}/reminders", [
            'remind_at' => '2026-09-01 10:00:00',
            'repeat_every' => '12d',
        ])->assertCreated()->assertJsonPath('data.repeat_every', '12d');
    }

    public function test_named_legacy_intervals_still_work(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $contact = $this->makeContact();

        foreach (['3d', 'week', 'month'] as $repeat) {
            $this->postJson("/api/v1/contacts/{$contact->id}/reminders", [
                'remind_at' => '2026-09-01 10:00:00',
                'repeat_every' => $repeat,
            ])->assertCreated()->assertJsonPath('data.repeat_every', $repeat);
        }
    }

    public function test_week_and_month_units_are_accepted(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $contact = $this->makeContact();

        foreach (['1w', '2w', '1m', '3m'] as $repeat) {
            $this->postJson("/api/v1/contacts/{$contact->id}/reminders", [
                'remind_at' => '2026-09-01 10:00:00',
                'repeat_every' => $repeat,
            ])->assertCreated()->assertJsonPath('data.repeat_every', $repeat);
        }
    }

    public function test_months_advance_by_calendar_month_not_thirty_days(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $this->travelTo('2026-01-31 08:00:00');
        $reminder = $this->makeReminder($this->makeContact(), '1m', '2026-01-31 14:30:00');

        $this->patchJson("/api/v1/reminders/{$reminder->id}", ['done' => true])->assertOk();

        // شهر تقويمي من 31 يناير = 28 فبراير (لا 2 مارس كما لو أُضيف 30 يومًا)
        $this->assertSame('2026-02-28', $reminder->refresh()->remind_at->toDateString());
    }

    public function test_the_chosen_time_of_day_survives_rescheduling(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $this->travelTo('2026-09-10 08:00:00');
        // كانت الجدولة تُثبَّت على 10:00 فتضيع ساعة المتابعة المختارة
        $reminder = $this->makeReminder($this->makeContact(), '2w', '2026-09-10 14:45:00');

        $this->patchJson("/api/v1/reminders/{$reminder->id}", ['done' => true])->assertOk();

        $next = $reminder->refresh()->remind_at;
        $this->assertSame('2026-09-24', $next->toDateString());
        $this->assertSame('14:45', $next->format('H:i'));
    }

    public function test_out_of_range_and_malformed_intervals_are_rejected(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $contact = $this->makeContact();

        foreach (['0d', '366d', '53w', '25m', '5', 'd', 'yearly', '-3d', '5 d', '2y'] as $bad) {
            $this->postJson("/api/v1/contacts/{$contact->id}/reminders", [
                'remind_at' => '2026-09-01 10:00:00',
                'repeat_every' => $bad,
            ])->assertStatus(422);
        }
    }

    public function test_completing_a_custom_interval_reschedules_by_that_many_days(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $this->travelTo('2026-09-10 08:00:00');
        $reminder = $this->makeReminder($this->makeContact(), '12d', '2026-09-10 10:00:00');

        $this->patchJson("/api/v1/reminders/{$reminder->id}", ['done' => true])
            ->assertOk()
            ->assertJsonPath('data.done', false) // أُعيد فتحها لدورتها التالية
            ->assertJsonPath('data.repeat_every', '12d');

        $this->assertSame('2026-09-22', $reminder->refresh()->remind_at->toDateString());
    }

    public function test_late_cycles_count_by_the_custom_interval(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $this->travelTo('2026-09-30 08:00:00');
        // متابعة كل 10 أيام فات موعدها بـ 25 يومًا → دورتان فائتتان + الحالية = 3
        $this->makeReminder($this->makeContact(), '10d', '2026-09-05 10:00:00');

        $this->getJson('/api/v1/crm/follow-ups')->assertOk()->assertJsonPath('data.0.late_cycles', 3);
    }

    public function test_the_model_reads_both_forms(): void
    {
        $this->assertSame(7, LeadReminder::repeatDays('week'));
        $this->assertSame(30, LeadReminder::repeatDays('month'));
        $this->assertSame(5, LeadReminder::repeatDays('5d'));
        $this->assertSame(365, LeadReminder::repeatDays('365d'));
        $this->assertSame(14, LeadReminder::repeatDays('2w'));
        $this->assertSame(90, LeadReminder::repeatDays('3m'));
        $this->assertSame([2, 'w'], LeadReminder::repeatParts('2w'));
        $this->assertSame([7, 'd'], LeadReminder::repeatParts('week'));
        $this->assertNull(LeadReminder::repeatDays('366d'));
        $this->assertNull(LeadReminder::repeatDays('53w'));
        $this->assertNull(LeadReminder::repeatDays(''));
        $this->assertNull(LeadReminder::repeatDays(null));
    }
}
