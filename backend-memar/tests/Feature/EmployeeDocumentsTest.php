<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Project;
use App\Models\StoredFile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** مستندات مشاريع الموظف — خدمة ذاتية (اجتماع 2026-08-07، بند 12). */
class EmployeeDocumentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_mine_lists_files_from_own_projects_only(): void
    {
        $me = $this->actingAsUserWith([]);
        $mine = Project::factory()->create(['manager_id' => $me->id]);
        $other = Project::factory()->create();
        StoredFile::create(['name' => 'مخطط', 'original_name' => 'plan.pdf', 'path' => 'files/plan.pdf', 'disk' => 'local', 'extension' => 'pdf', 'project_id' => $mine->id]);
        StoredFile::create(['name' => 'ملف آخر', 'original_name' => 'x.pdf', 'path' => 'files/x.pdf', 'disk' => 'local', 'extension' => 'pdf', 'project_id' => $other->id]);

        $this->getJson('/api/v1/me/documents')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.original_name', 'plan.pdf');
    }

    public function test_download_is_forbidden_for_a_file_outside_my_projects(): void
    {
        $this->actingAsUserWith([]);
        $other = Project::factory()->create();
        $file = StoredFile::create(['name' => 'x', 'original_name' => 'x.pdf', 'path' => 'files/x.pdf', 'disk' => 'local', 'project_id' => $other->id]);

        $this->getJson("/api/v1/me/documents/{$file->id}/download")->assertForbidden();
    }
}
