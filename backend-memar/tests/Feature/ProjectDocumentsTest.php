<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\GeneratedDocument;
use App\Models\Project;
use App\Models\StoredFile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectDocumentsTest extends TestCase
{
    use RefreshDatabase;

    private const VIEW = 'projects.view';

    public function test_endpoint_returns_only_this_projects_contract_documents_and_files(): void
    {
        $this->actingAsUserWith([self::VIEW]);
        $project = Project::factory()->create();
        $other = Project::factory()->create();

        Contract::query()->create(['number' => 'CON-1', 'project_id' => $project->id, 'value_kwd' => 5000, 'status' => 'signed']);
        Contract::query()->create(['number' => 'CON-X', 'project_id' => $other->id, 'value_kwd' => 1, 'status' => 'draft']);
        GeneratedDocument::query()->create(['project_id' => $project->id, 'title' => 'محضر تسليم', 'body_html' => '<p>x</p>']);
        StoredFile::query()->create(['name' => 'مخطط', 'original_name' => 'plan.pdf', 'path' => 'x/plan.pdf', 'project_id' => $project->id, 'extension' => 'pdf', 'size' => 1024]);
        StoredFile::query()->create(['name' => 'ملف آخر', 'original_name' => 'other.pdf', 'path' => 'x/other.pdf', 'project_id' => $other->id, 'extension' => 'pdf', 'size' => 10]);

        $res = $this->getJson("/api/v1/projects/{$project->id}/documents");

        $res->assertOk()
            ->assertJsonCount(1, 'data.contracts')
            ->assertJsonPath('data.contracts.0.number', 'CON-1')
            ->assertJsonCount(1, 'data.documents')
            ->assertJsonPath('data.documents.0.title', 'محضر تسليم')
            ->assertJsonCount(1, 'data.files')
            ->assertJsonPath('data.files.0.original_name', 'plan.pdf');
    }

    public function test_requires_view_permission(): void
    {
        $this->actingAsUserWith([]);
        $project = Project::factory()->create();

        $this->getJson("/api/v1/projects/{$project->id}/documents")->assertForbidden();
    }
}
