<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectPaymentsTest extends TestCase
{
    use RefreshDatabase;

    private const VIEW = 'projects.view';

    public function test_payments_endpoint_summarises_project_invoices(): void
    {
        $this->actingAsUserWith([self::VIEW]);
        $project = Project::factory()->create();

        Invoice::query()->create(['number' => 'INV-1', 'project_id' => $project->id, 'total_kwd' => 1000, 'paid_kwd' => 400, 'status' => 'partial']);
        Invoice::query()->create(['number' => 'INV-2', 'project_id' => $project->id, 'total_kwd' => 500, 'paid_kwd' => 500, 'status' => 'paid']);
        // فاتورة مشروع آخر يجب ألّا تُحتسب
        Invoice::query()->create(['number' => 'INV-X', 'project_id' => Project::factory()->create()->id, 'total_kwd' => 9999, 'paid_kwd' => 0, 'status' => 'sent']);

        $res = $this->getJson("/api/v1/projects/{$project->id}/payments");

        $res->assertOk()
            ->assertJsonPath('data.summary.invoiced_kwd', 1500)
            ->assertJsonPath('data.summary.paid_kwd', 900)
            ->assertJsonPath('data.summary.remaining_kwd', 600)
            ->assertJsonPath('data.summary.count', 2)
            ->assertJsonCount(2, 'data.invoices');
    }

    public function test_payments_endpoint_requires_view_permission(): void
    {
        $this->actingAsUserWith([]); // بلا صلاحيات
        $project = Project::factory()->create();

        $this->getJson("/api/v1/projects/{$project->id}/payments")->assertForbidden();
    }
}
