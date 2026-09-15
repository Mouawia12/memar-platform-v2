<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * فلتر نوع الحساب في سجل المستخدمين (طلب 2026-09-15):
 * الطاقم · العملاء · من سجّل من الصفحة العامة ولم يصر عميلًا بعد.
 */
class UserTypeFilterTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, User> */
    private function seedAccounts(): array
    {
        Role::findOrCreate('client', 'web');
        Role::findOrCreate('مهندس تصميم', 'web');

        $engineer = User::factory()->create(['name' => 'مهندس']);
        $engineer->assignRole('مهندس تصميم');

        $client = User::factory()->create([
            'name' => 'عميل',
            'contact_id' => Contact::factory()->create(['type' => 'client'])->id,
        ]);
        $client->assignRole('client');

        $visitor = User::factory()->create([
            'name' => 'زائر',
            'contact_id' => Contact::factory()->create(['type' => 'lead'])->id,
        ]);
        $visitor->assignRole('client');

        return compact('engineer', 'client', 'visitor');
    }

    /** @return array<int, int> */
    private function idsFor(string $type): array
    {
        return collect($this->getJson("/api/v1/users?type={$type}")->assertOk()->json('data'))->pluck('id')->all();
    }

    public function test_filters_staff_clients_and_public_signups(): void
    {
        $me = $this->actingAsUserWith(['users.view']);
        ['engineer' => $engineer, 'client' => $client, 'visitor' => $visitor] = $this->seedAccounts();

        // الموظف الحالي بلا دور بعد — يُعدّ من الطاقم لا من العملاء.
        $this->assertEqualsCanonicalizing([$me->id, $engineer->id], $this->idsFor('staff'));
        $this->assertSame([$client->id], $this->idsFor('client'));
        $this->assertSame([$visitor->id], $this->idsFor('public'));
    }

    public function test_unknown_type_returns_everyone(): void
    {
        $this->actingAsUserWith(['users.view']);
        $this->seedAccounts();

        $this->assertCount(4, $this->idsFor('whatever'));
    }

    public function test_visitor_moves_to_clients_once_his_record_becomes_a_client(): void
    {
        $this->actingAsUserWith(['users.view']);
        ['visitor' => $visitor] = $this->seedAccounts();

        $visitor->contact->update(['type' => 'client']);

        $this->assertContains($visitor->id, $this->idsFor('client'));
        $this->assertNotContains($visitor->id, $this->idsFor('public'));
    }

    public function test_type_counts(): void
    {
        $this->actingAsUserWith(['users.view']);
        $this->seedAccounts();

        $this->getJson('/api/v1/users/type-counts')
            ->assertOk()
            ->assertJsonPath('data', ['all' => 4, 'staff' => 2, 'client' => 1, 'public' => 1]);
    }

    public function test_type_counts_require_users_view(): void
    {
        $this->actingAsUserWith([]);

        $this->getJson('/api/v1/users/type-counts')->assertForbidden();
    }
}
