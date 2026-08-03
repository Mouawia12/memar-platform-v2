<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountNumberTest extends TestCase
{
    use RefreshDatabase;

    public function test_generates_mee_year_sequence_format(): void
    {
        $contact = Contact::factory()->create();

        $number = $contact->ensureAccountNumber();

        $year = now()->year;
        $this->assertSame("MEE-{$year}-001", $number);
        $this->assertSame($number, $contact->fresh()->account_number);
    }

    public function test_is_stable_once_generated(): void
    {
        $contact = Contact::factory()->create();

        $first = $contact->ensureAccountNumber();
        $second = $contact->ensureAccountNumber();

        $this->assertSame($first, $second);
    }

    public function test_sequence_increments_per_contact(): void
    {
        $year = now()->year;

        $a = Contact::factory()->create();
        $b = Contact::factory()->create();
        $c = Contact::factory()->create();

        $this->assertSame("MEE-{$year}-001", $a->ensureAccountNumber());
        $this->assertSame("MEE-{$year}-002", $b->ensureAccountNumber());
        $this->assertSame("MEE-{$year}-003", $c->ensureAccountNumber());
    }

    public function test_exposed_in_client_portal(): void
    {
        $contact = Contact::factory()->create();
        $user = \App\Models\User::factory()->create(['contact_id' => $contact->id]);
        \Laravel\Sanctum\Sanctum::actingAs($user);

        $this->getJson('/api/v1/client-portal')
            ->assertOk()
            ->assertJsonPath('data.client.account_number', 'MEE-'.now()->year.'-001');
    }
}
