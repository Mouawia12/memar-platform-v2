<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * إسناد الموظفين للمشاريع + «مشاريعي» + إشعار الإسناد + نظرة الأدمن (بند 11-14).
 */
class MyProjectsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_assigns_staff_and_member_gets_notification(): void
    {
        $admin = $this->actingAsUserWith(['projects.view', 'projects.manage']);
        $project = Project::factory()->create();
        $staff = User::factory()->create(['contact_id' => null]);

        $this->postJson("/api/v1/projects/{$project->id}/members", [
            'user_id' => $staff->id,
            'role_on_project' => 'مهندس معماري',
        ])->assertOk();

        $this->assertDatabaseHas('project_members', [
            'project_id' => $project->id, 'user_id' => $staff->id, 'role_on_project' => 'مهندس معماري', 'assigned_by' => $admin->id,
        ]);
        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $staff->id, 'type' => 'project_assigned', 'read_at' => null,
        ]);
    }

    public function test_my_projects_lists_assigned_with_new_flag_then_clears_on_seen(): void
    {
        $admin = $this->actingAsUserWith(['projects.view', 'projects.manage']);
        $project = Project::factory()->create(['name' => 'فيلا النرجس']);
        $staff = User::factory()->create(['contact_id' => null]);
        app(\App\Services\ProjectMemberService::class)->assign($project, $staff, 'مشرف', $admin);

        Sanctum::actingAs($staff);

        $res = $this->getJson('/api/v1/my/projects')->assertOk();
        $res->assertJsonPath('data.projects.0.name', 'فيلا النرجس')
            ->assertJsonPath('data.projects.0.has_new', true)
            ->assertJsonPath('data.new_count', 1);

        // فتح المشروع يعلّم آخر دخول → يختفي «الجديد»
        $this->postJson("/api/v1/projects/{$project->id}/seen")->assertOk();
        $this->getJson('/api/v1/my/projects')->assertOk()
            ->assertJsonPath('data.projects.0.has_new', false)
            ->assertJsonPath('data.new_count', 0);
    }

    public function test_viewing_my_projects_marks_assignment_notifications_read(): void
    {
        $admin = $this->actingAsUserWith(['projects.view', 'projects.manage']);
        $project = Project::factory()->create();
        $staff = User::factory()->create(['contact_id' => null]);
        app(\App\Services\ProjectMemberService::class)->assign($project, $staff, null, $admin);

        Sanctum::actingAs($staff);
        $this->assertDatabaseHas('app_notifications', ['user_id' => $staff->id, 'read_at' => null]);

        $this->getJson('/api/v1/my/projects')->assertOk();
        $this->assertSame(0, $staff->appNotifications()->whereNull('read_at')->count());
    }

    public function test_shared_project_between_two_employees(): void
    {
        $admin = $this->actingAsUserWith(['projects.view', 'projects.manage']);
        $project = Project::factory()->create();
        $a = User::factory()->create(['contact_id' => null]);
        $b = User::factory()->create(['contact_id' => null]);
        $svc = app(\App\Services\ProjectMemberService::class);
        $svc->assign($project, $a, 'معماري', $admin);
        $svc->assign($project, $b, 'إنشائي', $admin);

        $this->getJson("/api/v1/projects/{$project->id}/members")->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_assignable_excludes_clients_and_current_members(): void
    {
        $this->actingAsUserWith(['projects.view', 'projects.manage']);
        $project = Project::factory()->create();
        $staff = User::factory()->create(['contact_id' => null]);
        $client = User::factory()->create(['contact_id' => \App\Models\Contact::factory()->create()->id]);

        $res = $this->getJson("/api/v1/projects/{$project->id}/assignable-members")->assertOk();
        $ids = array_column($res->json('data'), 'id');
        $this->assertContains($staff->id, $ids);
        $this->assertNotContains($client->id, $ids); // عميل بوابة — ليس طاقمًا
    }

    public function test_team_overview_counts_assignments(): void
    {
        $admin = $this->actingAsUserWith(['projects.view', 'projects.manage']);
        $staff = User::factory()->create(['contact_id' => null]);
        $svc = app(\App\Services\ProjectMemberService::class);
        $svc->assign(Project::factory()->create(), $staff, null, $admin);
        $svc->assign(Project::factory()->create(), $staff, null, $admin);

        $res = $this->getJson('/api/v1/team/projects')->assertOk();
        $row = collect($res->json('data.team'))->firstWhere('id', $staff->id);
        $this->assertSame(2, $row['projects_count']);
        $this->assertGreaterThanOrEqual(1, $res->json('data.totals.assignments'));
    }

    public function test_assign_requires_manage_permission(): void
    {
        $this->actingAsUserWith(['projects.view']); // عرض فقط
        $project = Project::factory()->create();
        $staff = User::factory()->create(['contact_id' => null]);

        $this->postJson("/api/v1/projects/{$project->id}/members", ['user_id' => $staff->id])
            ->assertForbidden();
    }
}
