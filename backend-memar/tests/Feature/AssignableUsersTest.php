<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * قائمة الطاقم للإسناد (/users/assignable) — لأي عضو طاقم بلا users.view، وتمنع العملاء.
 * طلب أيمن 2026-08-17: الموظف يضيف مهمة ويسندها دون كشف إدارة المستخدمين.
 */
class AssignableUsersTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_without_users_view_can_list_assignable_staff(): void
    {
        // موظف يملك tasks.manage فقط — بلا users.view.
        $this->actingAsUserWith(['tasks.manage']);
        $peer = User::factory()->create(['name' => 'م. سارة', 'is_active' => true, 'contact_id' => null]);

        $res = $this->getJson('/api/v1/users/assignable')->assertOk();
        $ids = collect($res->json('data'))->pluck('id')->all();

        $this->assertContains($peer->id, $ids);
        // كل عنصر اسم + معرّف فقط (بلا بيانات إدارة مستخدمين)
        $first = $res->json('data.0');
        $this->assertSame(['id', 'name'], array_keys($first));
    }

    public function test_client_account_is_forbidden(): void
    {
        $contact = Contact::factory()->create();
        $client = User::factory()->create(['contact_id' => $contact->id, 'is_active' => true]);
        Sanctum::actingAs($client);

        $this->getJson('/api/v1/users/assignable')->assertForbidden();
    }

    public function test_list_excludes_clients_and_inactive_users(): void
    {
        $this->actingAsUserWith(['tasks.manage']);
        $active = User::factory()->create(['is_active' => true, 'contact_id' => null]);
        $inactive = User::factory()->create(['is_active' => false, 'contact_id' => null]);
        $clientUser = User::factory()->create(['is_active' => true, 'contact_id' => Contact::factory()->create()->id]);

        $ids = collect($this->getJson('/api/v1/users/assignable')->assertOk()->json('data'))->pluck('id')->all();

        $this->assertContains($active->id, $ids);
        $this->assertNotContains($inactive->id, $ids);
        $this->assertNotContains($clientUser->id, $ids);
    }
}
