<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * الصورة الشخصية للموظف (طلب أيمن 2026-08-04): رفع بالنقر على دائرة الكارت،
 * تُعرض كـ data URI، وقابلة للحذف.
 */
class UserAvatarTest extends TestCase
{
    use RefreshDatabase;

    public function test_upload_sets_avatar_data_uri_then_delete_clears_it(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/auth/me/avatar', ['file' => UploadedFile::fake()->image('me.jpg', 48, 48)])
            ->assertOk()
            ->assertJsonPath('data.avatar_url', fn ($v): bool => is_string($v) && str_starts_with($v, 'data:image'));

        $this->assertNotNull($user->fresh()->avatar_file_id);

        $this->deleteJson('/api/v1/auth/me/avatar')
            ->assertOk()
            ->assertJsonPath('data.avatar_url', null);

        $this->assertNull($user->fresh()->avatar_file_id);
    }

    public function test_rejects_non_image_file(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/auth/me/avatar', ['file' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf')])
            ->assertStatus(422);
    }

    public function test_avatar_requires_authentication(): void
    {
        Storage::fake('local');

        $this->postJson('/api/v1/auth/me/avatar', ['file' => UploadedFile::fake()->image('me.jpg')])
            ->assertUnauthorized();
    }
}
