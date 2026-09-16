<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * لوحة إدارة الفرص الجديدة (2026-09-16): مهلة الرد على طلب الإدارة، طلب التحديث
 * بلا سؤال، الأرشفة، زمن الرد، والعروض المحفوظة.
 */
class CrmBoardTest extends TestCase
{
    use RefreshDatabase;

    private function employee(): User
    {
        $user = User::factory()->create();
        $user->givePermissionTo(Permission::findOrCreate('crm.view', 'web'));

        return $user;
    }

    private function opportunity(User $owner, array $extra = []): Contact
    {
        return Contact::create($extra + ['full_name' => 'فرصة تجريبية', 'type' => 'lead', 'owner_id' => $owner->id]);
    }

    public function test_a_request_carries_its_reply_deadline(): void
    {
        Carbon::setTestNow('2026-09-16 10:00:00');
        $this->actingAsUserWith(['crm.view', 'crm.delete']);
        $opportunity = $this->opportunity($this->employee());

        $this->postJson("/api/v1/contacts/{$opportunity->id}/directives", ['body' => 'ما الجديد؟', 'hours' => 4])
            ->assertCreated()
            ->assertJsonPath('data.deadline_at', Carbon::parse('2026-09-16 14:00:00')->toIso8601String());

        $card = $this->getJson('/api/v1/contacts?type=lead')->json('data.0');
        $this->assertSame(Carbon::parse('2026-09-16 14:00:00')->toIso8601String(), $card['directive']['deadline_at']);
        Carbon::setTestNow();
    }

    public function test_an_update_request_may_have_no_question_and_no_deadline(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.delete']);
        $opportunity = $this->opportunity($this->employee());

        $this->postJson("/api/v1/contacts/{$opportunity->id}/directives", [])
            ->assertCreated()
            ->assertJsonPath('data.body', '')
            ->assertJsonPath('data.deadline_at', null);

        $this->assertSame('awaiting', $this->getJson('/api/v1/contacts?type=lead')->json('data.0.directive_state'));
    }

    public function test_deadline_must_be_a_sane_number_of_hours(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.delete']);
        $opportunity = $this->opportunity($this->employee());

        $this->postJson("/api/v1/contacts/{$opportunity->id}/directives", ['hours' => 5000])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('hours');
    }

    public function test_response_hours_measure_the_owner_first_reply(): void
    {
        Carbon::setTestNow('2026-09-16 08:00:00');
        $this->actingAsUserWith(['crm.view', 'crm.delete']);
        $employee = $this->employee();
        $opportunity = $this->opportunity($employee);
        $directive = $this->postJson("/api/v1/contacts/{$opportunity->id}/directives", ['body' => 'تابع'])->json('data.id');

        Carbon::setTestNow('2026-09-16 11:30:00');
        $this->actingAs($employee);
        $this->postJson("/api/v1/contacts/{$opportunity->id}/directives/{$directive}/messages", ['body' => 'تم'])->assertCreated();

        $this->assertEquals([3.5], $this->getJson('/api/v1/contacts?type=lead')->json('data.0.response_hours'));
        Carbon::setTestNow();
    }

    public function test_archiving_removes_the_opportunity_from_the_board_until_restored(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.delete']);
        $employee = $this->employee();
        $kept = $this->opportunity($employee, ['full_name' => 'تبقى']);
        $archived = $this->opportunity($employee, ['full_name' => 'تُؤرشف']);

        $this->postJson("/api/v1/crm/opportunities/{$archived->id}/archive")->assertOk();

        $this->assertSame(['تبقى'], collect($this->getJson('/api/v1/contacts?type=lead&archived=without')->json('data'))->pluck('full_name')->all());
        $this->assertSame(['تُؤرشف'], collect($this->getJson('/api/v1/contacts?type=lead&archived=only')->json('data'))->pluck('full_name')->all());
        $this->assertCount(2, $this->getJson('/api/v1/contacts?type=lead')->json('data'));

        $this->postJson("/api/v1/crm/opportunities/{$archived->id}/unarchive")->assertOk();
        $this->assertCount(2, $this->getJson('/api/v1/contacts?type=lead&archived=without')->json('data'));
        $this->assertNotNull($kept->fresh());
    }

    public function test_archiving_needs_management_permission(): void
    {
        $employee = $this->employee();
        $opportunity = $this->opportunity($employee);
        $this->actingAs($employee);

        $this->postJson("/api/v1/crm/opportunities/{$opportunity->id}/archive")->assertForbidden();
        $this->assertNull($opportunity->fresh()->archived_at);
    }

    public function test_saved_board_views_are_stored_per_user(): void
    {
        $user = $this->actingAsUserWith(['crm.view']);
        $views = [['id' => 'v1', 'name' => 'فرص ساخنة', 'search' => '', 'status' => 'question', 'owner' => 'all', 'priority' => 'all', 'temperature' => 'hot', 'tag' => 'all']];

        $this->patchJson('/api/v1/auth/me/ui-prefs', ['crm_views' => $views])->assertOk();

        $this->assertSame('فرص ساخنة', $user->fresh()->ui_prefs['crm_views'][0]['name']);
    }

    public function test_backup_carries_every_board_opportunity_with_its_owner(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.delete']);
        $employee = $this->employee();
        $this->opportunity($employee, ['full_name' => 'فرصة أولى', 'stage' => 'quote', 'tags' => ['VIP']]);
        $archived = $this->opportunity($employee, ['full_name' => 'مؤرشفة']);
        $this->postJson("/api/v1/crm/opportunities/{$archived->id}/archive")->assertOk();

        $res = $this->getJson('/api/v1/crm/backup')->assertOk();

        $res->assertJsonPath('data.count', 2)
            ->assertJsonPath('data.opportunities.0.full_name', 'فرصة أولى')
            ->assertJsonPath('data.opportunities.0.stage', 'quote')
            ->assertJsonPath('data.opportunities.0.owner.id', $employee->id);
        $this->assertNotNull($res->json('data.opportunities.1.archived_at'));
    }

    public function test_restore_updates_existing_revives_deleted_and_creates_missing(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.delete']);
        $employee = $this->employee();
        $kept = $this->opportunity($employee, ['full_name' => 'اسم قديم']);
        $deleted = $this->opportunity($employee, ['full_name' => 'محذوفة']);
        $untouched = $this->opportunity($employee, ['full_name' => 'لم تكن في النسخة']);
        $deleted->delete();

        $this->postJson('/api/v1/crm/restore', ['opportunities' => [
            ['id' => $kept->id, 'full_name' => 'اسم من النسخة', 'stage' => 'quote', 'owner' => ['id' => $employee->id]],
            ['id' => $deleted->id, 'full_name' => 'محذوفة', 'owner' => ['id' => $employee->id]],
            ['id' => 99999, 'full_name' => 'ناقصة', 'owner' => ['id' => $employee->id]],
        ]])->assertOk()
            ->assertJsonPath('data.updated', 1)
            ->assertJsonPath('data.restored', 1)
            ->assertJsonPath('data.created', 1);

        $this->assertSame('اسم من النسخة', $kept->fresh()->full_name);
        $this->assertNull($deleted->fresh()->deleted_at);
        // لا تُحذف فرصة غائبة عن الملف، ولا تُنشأ الناقصة بمعرّف وهمي.
        $this->assertNotNull($untouched->fresh());
        $this->assertNull(Contact::find(99999));
        $this->assertNotNull(Contact::where('full_name', 'ناقصة')->first());
    }

    public function test_restore_ignores_an_owner_whose_account_is_gone(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.delete']);

        $this->postJson('/api/v1/crm/restore', ['opportunities' => [
            ['full_name' => 'بلا مكلّف', 'owner' => ['id' => 4242]],
        ]])->assertOk()->assertJsonPath('data.created', 1);

        $this->assertNull(Contact::where('full_name', 'بلا مكلّف')->first()->owner_id);
    }

    public function test_backup_and_restore_need_management_permission(): void
    {
        $employee = $this->employee();
        $this->actingAs($employee);

        $this->getJson('/api/v1/crm/backup')->assertForbidden();
        $this->postJson('/api/v1/crm/restore', ['opportunities' => [['full_name' => 'ممنوعة']]])->assertForbidden();
        $this->assertNull(Contact::where('full_name', 'ممنوعة')->first());
    }

    public function test_restore_rejects_a_file_without_opportunities(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.delete']);

        $this->postJson('/api/v1/crm/restore', ['exported_at' => 'x'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('opportunities');
    }
}
