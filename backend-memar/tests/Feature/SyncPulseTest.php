<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * نبضة التزامن اللحظي — تتأكّد أن تعديل دورٍ ينعكس على طابع نبضة دورٍ آخر
 * (فتُبطل الواجهة كاشها وتُحدّث)، وأن الطوابع محكومة بالصلاحيات.
 */
class SyncPulseTest extends TestCase
{
    use RefreshDatabase;

    public function test_pulse_chat_token_changes_when_the_other_party_sends_a_message(): void
    {
        $me = $this->actingAsUserWith([]);
        $other = User::factory()->create();
        $convId = $this->postJson('/api/v1/chat/conversations', ['type' => 'direct', 'user_id' => $other->id])->json('data.id');

        // نبضة الطرف الآخر قبل وصول رسالة
        Sanctum::actingAs($other);
        $before = $this->getJson('/api/v1/sync/pulse')->assertOk()->json('data.chat');

        // أنا أرسل رسالة في المحادثة
        Sanctum::actingAs($me);
        $this->postJson("/api/v1/chat/conversations/{$convId}/messages", ['body' => 'تحديث لحظي'])->assertCreated();

        // نبضة الطرف الآخر تغيّرت → الواجهة ستُبطل كاش المحادثات وتُحدّث
        Sanctum::actingAs($other);
        $after = $this->getJson('/api/v1/sync/pulse')->assertOk()->json('data.chat');

        $this->assertNotNull($after);
        $this->assertNotSame($before, $after);
    }

    public function test_pulse_leads_token_changes_when_a_lead_is_updated(): void
    {
        $this->actingAsUserWith(['crm.view']);
        $lead = Contact::factory()->create(['type' => 'lead']);

        $first = $this->getJson('/api/v1/sync/pulse')->assertOk()->json('data.leads');
        $this->assertNotNull($first);

        // تعديل الفرصة (بطابع زمني لاحق مؤكّد) — يمثّل تعديل دورٍ آخر
        DB::table('contacts')->where('id', $lead->id)->update(['updated_at' => now()->addMinutes(5)]);

        $second = $this->getJson('/api/v1/sync/pulse')->assertOk()->json('data.leads');
        $this->assertNotSame($first, $second);
    }

    public function test_pulse_hides_leads_without_permission(): void
    {
        $this->actingAsUserWith([]); // بلا crm.view
        Contact::factory()->create(['type' => 'lead']);

        $leads = $this->getJson('/api/v1/sync/pulse')->assertOk()->json('data.leads');
        $this->assertNull($leads);
    }

    public function test_pulse_returns_all_domain_tokens_shape(): void
    {
        $this->actingAsUserWith([]);
        $this->getJson('/api/v1/sync/pulse')->assertOk()->assertJsonStructure([
            'data' => ['server_time', 'chat', 'leads', 'projects', 'tasks', 'notifications'],
        ]);
    }
}
