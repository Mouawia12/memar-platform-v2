<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\LeadReminder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * المتابعة المتكرّرة لا تسقط في «متأخرة» (طلب 2026-09-15): تظهر في «اليوم» يوم
 * دورتها، وتعود لـ«مجدولة» بموعد دورتها التالية حين يمضي يومها.
 */
class RecurringFollowUpBoardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-09-15 20:00:00');
        $this->actingAsUserWith(['crm.view']);
    }

    private function followUp(string $at, ?string $repeat, bool $done = false): LeadReminder
    {
        $contact = Contact::create(['full_name' => 'شركة الفهد', 'type' => 'lead', 'stage' => 'new']);

        return $contact->reminders()->create(['remind_at' => $at, 'repeat_every' => $repeat, 'done' => $done, 'note' => 'متابعة']);
    }

    /** @return array{0: string, 1: int} */
    private function card(): array
    {
        $card = $this->getJson('/api/v1/crm/follow-ups')->assertOk()->json('data.0');

        return [$card['remind_at'], $card['late_cycles']];
    }

    public function test_weekly_follow_up_shows_today_on_its_cycle_day(): void
    {
        $this->followUp('2026-09-08 11:00:00', 'week');

        // فاتت دورة 8 سبتمبر، ودورة اليوم لم يمضِ يومها — والساعة كما هي
        $this->assertSame(['2026-09-15T11:00:00+00:00', 1], $this->card());
    }

    public function test_missed_cycle_moves_to_the_next_one_not_to_overdue(): void
    {
        $this->followUp('2026-09-12 09:30:00', 'week');

        $this->assertSame(['2026-09-19T09:30:00+00:00', 1], $this->card());
    }

    public function test_todays_cycle_is_not_late_even_after_its_hour(): void
    {
        $this->followUp('2026-09-15 09:00:00', '3d');

        $this->assertSame(['2026-09-15T09:00:00+00:00', 0], $this->card());
    }

    public function test_several_missed_cycles_are_counted(): void
    {
        $this->followUp('2026-09-01 10:00:00', '2d'); // 1،3،5،7،9،11،13 فاتت → 15 اليوم

        $this->assertSame(['2026-09-15T10:00:00+00:00', 7], $this->card());
    }

    public function test_one_off_follow_up_still_goes_overdue(): void
    {
        $this->followUp('2026-09-12 09:30:00', null);

        $this->assertSame(['2026-09-12T09:30:00+00:00', 1], $this->card());
    }

    public function test_done_recurring_follow_up_keeps_its_stored_date(): void
    {
        $this->followUp('2026-09-12 09:30:00', 'week', done: true);

        $this->assertSame(['2026-09-12T09:30:00+00:00', 0], $this->card());
    }

    public function test_stored_date_is_not_rewritten_by_reading_the_board(): void
    {
        $fup = $this->followUp('2026-09-12 09:30:00', 'week');

        $this->card();

        $this->assertSame('2026-09-12 09:30:00', $fup->fresh()->remind_at->toDateTimeString());
    }
}
