<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Project;
use App\Models\StoredFile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * نطاق مدير الملفات: `documents.view` وحدها لا تفتح ملفات المكتب كلّها.
 *
 * كانت /files تُرجع كل سجلّات StoredFile بلا ترشيح، و/files/{file}/download بلا فحص
 * ملكية — و`documents.view` يحملها دور «الموظف» الأساسي وكل الأدوار المهنية الثمانية.
 * أي أن الرسّام كان يستطيع تعداد وتنزيل صكوك ملكية العملاء المرفوعة من بوابة العميل.
 * هنا نثبّت القاعدة الجديدة: ملفات مشاريعه وما رفعه هو — إلا بـ`documents.view.all`.
 */
class FileAccessScopeTest extends TestCase
{
    use RefreshDatabase;

    /** ينشئ سجلّ ملف على القرص الوهمي ليصلح للتنزيل أيضًا. */
    private function storedFile(array $attributes = []): StoredFile
    {
        $file = StoredFile::create(array_merge([
            'name' => 'مخطط',
            'original_name' => 'plan.pdf',
            'path' => 'files/'.uniqid().'.pdf',
            'disk' => 'local',
            'mime' => 'application/pdf',
            'extension' => 'pdf',
            'size' => 1024,
        ], $attributes));

        Storage::disk('local')->put($file->path, 'محتوى');

        return $file;
    }

    private function actingAsStaffWith(array $permissions): User
    {
        $user = $this->actingAsUserWith($permissions);
        $user->forceFill(['contact_id' => null])->save();

        return $user;
    }

    public function test_employee_sees_only_files_of_own_projects(): void
    {
        $user = $this->actingAsStaffWith(['documents.view']);

        $mine = $this->storedFile(['project_id' => Project::factory()->create(['manager_id' => $user->id])->id]);

        $memberProject = Project::factory()->create();
        $memberProject->members()->attach($user->id, ['assigned_at' => now()]);
        $asMember = $this->storedFile(['project_id' => $memberProject->id]);

        $foreign = $this->storedFile(['project_id' => Project::factory()->create()->id]);

        $ids = collect($this->getJson('/api/v1/files')->assertOk()->json('data'))->pluck('id')->all();

        $this->assertContains($mine->id, $ids);
        $this->assertContains($asMember->id, $ids);
        $this->assertNotContains($foreign->id, $ids, 'ملف مشروع لا يخصّه ظهر في سجلّه');
    }

    public function test_employee_still_sees_files_they_uploaded_themselves(): void
    {
        $user = $this->actingAsStaffWith(['documents.view']);
        $own = $this->storedFile(['uploaded_by' => $user->id]); // بلا مشروع

        $ids = collect($this->getJson('/api/v1/files')->assertOk()->json('data'))->pluck('id')->all();

        $this->assertContains($own->id, $ids);
    }

    public function test_client_portal_uploads_are_hidden_from_ordinary_employees(): void
    {
        $this->actingAsStaffWith(['documents.view']);

        // مرفوعات بوابة العميل: contact_id بلا project_id (صكوك، كروكيات، صور شخصية)
        $deed = $this->storedFile([
            'folder' => 'طلبات العملاء',
            'contact_id' => Contact::factory()->create()->id,
            'original_name' => 'صك-ملكية.pdf',
        ]);

        $ids = collect($this->getJson('/api/v1/files')->assertOk()->json('data'))->pluck('id')->all();

        $this->assertNotContains($deed->id, $ids, 'صكّ عميل ظهر لموظف لا يملك documents.view.all');
        $this->getJson("/api/v1/files/{$deed->id}/download")->assertForbidden();
    }

    public function test_view_all_permission_opens_every_file(): void
    {
        $this->actingAsStaffWith(['documents.view', 'documents.view.all']);

        $deed = $this->storedFile(['contact_id' => Contact::factory()->create()->id]);
        $foreign = $this->storedFile(['project_id' => Project::factory()->create()->id]);

        $ids = collect($this->getJson('/api/v1/files')->assertOk()->json('data'))->pluck('id')->all();

        $this->assertContains($deed->id, $ids);
        $this->assertContains($foreign->id, $ids);
        $this->getJson("/api/v1/files/{$deed->id}/download")->assertOk();
    }

    public function test_download_of_foreign_project_file_is_forbidden(): void
    {
        $this->actingAsStaffWith(['documents.view']);
        $foreign = $this->storedFile(['project_id' => Project::factory()->create()->id]);

        $this->getJson("/api/v1/files/{$foreign->id}/download")->assertForbidden();
    }

    public function test_update_and_delete_of_foreign_file_are_forbidden(): void
    {
        $this->actingAsStaffWith(['documents.view', 'documents.manage']);
        $foreign = $this->storedFile(['project_id' => Project::factory()->create()->id]);

        $this->patchJson("/api/v1/files/{$foreign->id}", ['name' => 'اسم جديد'])->assertForbidden();
        $this->deleteJson("/api/v1/files/{$foreign->id}")->assertForbidden();

        $this->assertDatabaseHas('stored_files', ['id' => $foreign->id, 'name' => 'مخطط']);
    }

    public function test_stats_are_scoped_like_the_listing(): void
    {
        $user = $this->actingAsStaffWith(['documents.view']);

        $this->storedFile(['project_id' => Project::factory()->create(['manager_id' => $user->id])->id, 'size' => 100]);
        $this->storedFile(['project_id' => Project::factory()->create()->id, 'size' => 9_000]);

        $stats = $this->getJson('/api/v1/files/stats')->assertOk()->json('data');

        $this->assertSame(1, $stats['count'], 'الإحصاءات عدّت ملفات خارج نطاق الموظف');
        $this->assertSame(100, $stats['total_size']);
    }

    public function test_client_account_cannot_reach_the_file_manager_at_all(): void
    {
        $client = User::factory()->create(['contact_id' => Contact::factory()->create()->id]);
        Sanctum::actingAs($client);

        $this->getJson('/api/v1/files')->assertForbidden();
    }
}
