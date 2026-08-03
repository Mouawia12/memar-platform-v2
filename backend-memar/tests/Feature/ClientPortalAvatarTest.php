<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClientPortalAvatarTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_can_upload_an_avatar_and_it_is_returned_as_data_uri(): void
    {
        Storage::fake('local');
        $contact = Contact::factory()->create();
        $user = User::factory()->create(['contact_id' => $contact->id]);
        Sanctum::actingAs($user);

        $res = $this->postJson('/api/v1/client-portal/profile/avatar', [
            'file' => UploadedFile::fake()->image('me.jpg', 200, 200),
        ]);

        $res->assertCreated();
        $this->assertStringStartsWith('data:image/', (string) $res->json('data.avatar_url'));

        $contact->refresh();
        $this->assertNotNull($contact->avatar_file_id);
        $this->assertDatabaseHas('stored_files', ['id' => $contact->avatar_file_id, 'contact_id' => $contact->id]);

        // البوابة تُعيد الصورة في حمولة العميل
        $this->assertStringStartsWith('data:image/', (string) $this->getJson('/api/v1/client-portal')->json('data.client.avatar_url'));
    }

    public function test_uploading_a_new_avatar_replaces_and_deletes_the_old_file(): void
    {
        Storage::fake('local');
        $contact = Contact::factory()->create();
        $user = User::factory()->create(['contact_id' => $contact->id]);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/client-portal/profile/avatar', ['file' => UploadedFile::fake()->image('a.png')])->assertCreated();
        $firstId = $contact->refresh()->avatar_file_id;

        $this->postJson('/api/v1/client-portal/profile/avatar', ['file' => UploadedFile::fake()->image('b.png')])->assertCreated();
        $secondId = $contact->refresh()->avatar_file_id;

        $this->assertNotSame($firstId, $secondId);
        $this->assertSoftDeleted('stored_files', ['id' => $firstId]);
    }

    public function test_client_can_delete_their_avatar(): void
    {
        Storage::fake('local');
        $contact = Contact::factory()->create();
        $user = User::factory()->create(['contact_id' => $contact->id]);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/client-portal/profile/avatar', ['file' => UploadedFile::fake()->image('a.png')])->assertCreated();
        $fileId = $contact->refresh()->avatar_file_id;

        $this->deleteJson('/api/v1/client-portal/profile/avatar')->assertOk();

        $this->assertNull($contact->refresh()->avatar_file_id);
        $this->assertSoftDeleted('stored_files', ['id' => $fileId]);
    }

    public function test_non_image_upload_is_rejected(): void
    {
        Storage::fake('local');
        $user = User::factory()->create(['contact_id' => Contact::factory()->create()->id]);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/client-portal/profile/avatar', [
            'file' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
        ])->assertStatus(422);
    }
}
