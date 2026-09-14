<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * توجيه الإدارة على بطاقة الفرصة (طلب أيمن 2026-09-13): لون البطاقة في اللوحة
 * يُشتقّ من حالة الخيط — أحمر ينتظر ردّ الموظف، أخضر ردَّ، أبيض بلا توجيه.
 */
class OpportunityDirectiveTest extends TestCase
{
    use RefreshDatabase;

    /** موظف يملك crm.view — يرى لوحته ويردّ على توجيهاتها. */
    private function employee(): User
    {
        $user = User::factory()->create();
        $user->givePermissionTo(Permission::findOrCreate('crm.view', 'web'));

        return $user;
    }

    private function opportunity(User $owner): Contact
    {
        return Contact::create([
            'full_name' => 'فرصة تجريبية',
            'type' => 'lead',
            'owner_id' => $owner->id,
        ]);
    }

    public function test_a_card_without_a_directive_has_no_state(): void
    {
        $me = $this->actingAsUserWith(['crm.view']);
        $this->opportunity($me);

        $card = $this->getJson('/api/v1/contacts')->assertOk()->json('data.0');

        $this->assertNull($card['directive_state']);
        $this->assertNull($card['directive']);
    }

    public function test_a_sent_directive_leaves_the_card_awaiting_its_owner(): void
    {
        $manager = $this->actingAsUserWith(['crm.view', 'crm.delete']);
        $employee = $this->employee();
        $opportunity = $this->opportunity($employee);

        $this->postJson("/api/v1/contacts/{$opportunity->id}/directives", ['body' => 'ما آخر أخبار هذه الفرصة؟'])
            ->assertCreated();

        $card = $this->getJson('/api/v1/contacts')->assertOk()->json('data.0');
        $this->assertSame('awaiting', $card['directive_state']);
        $this->assertSame('ما آخر أخبار هذه الفرصة؟', $card['directive']['body']);
        $this->assertSame($manager->id, $card['directive']['sender']['id']);
    }

    public function test_the_owner_reply_turns_the_card_replied(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.delete']);
        $employee = $this->employee();
        $opportunity = $this->opportunity($employee);
        $directive = $this->postJson("/api/v1/contacts/{$opportunity->id}/directives", ['body' => 'تابع العميل'])
            ->assertCreated()->json('data.id');

        $this->actingAs($employee);
        $this->postJson("/api/v1/contacts/{$opportunity->id}/directives/{$directive}/messages", ['body' => 'تواصلتُ معه اليوم'])
            ->assertCreated();

        $card = $this->getJson('/api/v1/contacts')->assertOk()->json('data.0');
        $this->assertSame('replied', $card['directive_state']);
    }

    public function test_management_asking_again_puts_the_ball_back_in_the_owner_court(): void
    {
        $manager = $this->actingAsUserWith(['crm.view', 'crm.delete']);
        $employee = $this->employee();
        $opportunity = $this->opportunity($employee);
        $directive = $this->postJson("/api/v1/contacts/{$opportunity->id}/directives", ['body' => 'تابع'])
            ->assertCreated()->json('data.id');

        $this->actingAs($employee);
        $this->postJson("/api/v1/contacts/{$opportunity->id}/directives/{$directive}/messages", ['body' => 'تمّ'])->assertCreated();

        // الإدارة تسأل من جديد في الخيط نفسه → يعود أحمر
        $this->actingAs($manager);
        $this->postJson("/api/v1/contacts/{$opportunity->id}/directives/{$directive}/messages", ['body' => 'وماذا بعد؟'])->assertCreated();

        $card = $this->getJson('/api/v1/contacts')->assertOk()->json('data.0');
        $this->assertSame('awaiting', $card['directive_state']);
    }

    public function test_the_employee_sees_the_unread_count_on_the_card(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.delete']);
        $employee = $this->employee();
        $opportunity = $this->opportunity($employee);
        $this->postJson("/api/v1/contacts/{$opportunity->id}/directives", ['body' => 'سؤال الإدارة'])->assertCreated();

        $this->actingAs($employee);
        $card = $this->getJson('/api/v1/contacts')->assertOk()->json('data.0');
        $this->assertSame(1, $card['directive_unread']);

        // وبعد فتح الخيط يختفي الرقم
        $this->getJson("/api/v1/contacts/{$opportunity->id}/directives")->assertOk();
        $card = $this->getJson('/api/v1/contacts')->assertOk()->json('data.0');
        $this->assertSame(0, $card['directive_unread']);
    }

    public function test_sending_a_directive_needs_management_permission(): void
    {
        $me = $this->actingAsUserWith(['crm.view']);
        $opportunity = $this->opportunity($me);

        $this->postJson("/api/v1/contacts/{$opportunity->id}/directives", ['body' => 'لا يجوز'])->assertForbidden();
    }
}
