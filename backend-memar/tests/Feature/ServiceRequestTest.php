<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * صفحة «الطلبات الواردة» (/service-requests): البيانات الحقيقية + صلاحيات الرؤية.
 * الأدمن (requests.view.all) يرى الكل؛ الموظف (requests.view) يرى المُسنَد إليه/الذي أنشأه فقط.
 */
class ServiceRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_with_view_all_sees_every_request(): void
    {
        ServiceRequest::create(['title' => 'طلب أ', 'type' => 'design', 'client_name' => 'عميل أ', 'priority' => 'normal', 'status' => 'open']);
        ServiceRequest::create(['title' => 'طلب ب', 'type' => 'inquiry', 'client_name' => 'عميل ب', 'priority' => 'high', 'status' => 'open']);

        $this->actingAsUserWith(['requests.view', 'requests.view.all']);

        $res = $this->getJson('/api/v1/service-requests');

        $res->assertOk();
        $this->assertSame(2, $res->json('meta.total'));
    }

    public function test_engineer_without_view_all_sees_only_assigned_requests(): void
    {
        $engineer = User::factory()->create();

        $assigned = ServiceRequest::create(['title' => 'طلب مُسنَد', 'type' => 'supervision', 'client_name' => 'عميل مسند', 'priority' => 'normal', 'status' => 'open', 'assigned_to' => $engineer->id]);
        ServiceRequest::create(['title' => 'طلب موظف آخر', 'type' => 'design', 'client_name' => 'عميل آخر', 'priority' => 'normal', 'status' => 'open']);

        $engineer->givePermissionTo(\Spatie\Permission\Models\Permission::findOrCreate('requests.view', 'web'));
        Sanctum::actingAs($engineer);

        $res = $this->getJson('/api/v1/service-requests');

        $res->assertOk();
        $this->assertSame(1, $res->json('meta.total'));
        $this->assertSame($assigned->id, $res->json('data.0.id'));
        $this->assertSame($engineer->id, $res->json('data.0.assignee.id'));
    }

    public function test_engineer_also_sees_requests_they_created(): void
    {
        $engineer = User::factory()->create();
        ServiceRequest::create(['title' => 'طلب أنشأه الموظف', 'type' => 'other', 'client_name' => 'عميل', 'priority' => 'low', 'status' => 'open', 'requested_by' => $engineer->id]);
        ServiceRequest::create(['title' => 'طلب غريب', 'type' => 'other', 'client_name' => 'عميل', 'priority' => 'low', 'status' => 'open']);

        $engineer->givePermissionTo(\Spatie\Permission\Models\Permission::findOrCreate('requests.view', 'web'));
        Sanctum::actingAs($engineer);

        $res = $this->getJson('/api/v1/service-requests');

        $res->assertOk();
        $this->assertSame(1, $res->json('meta.total'));
    }

    public function test_admin_can_assign_a_request_to_an_engineer_and_engineer_then_sees_it(): void
    {
        $engineer = User::factory()->create();
        $req = ServiceRequest::create(['title' => 'طلب للإسناد', 'type' => 'design', 'client_name' => 'عميل', 'priority' => 'normal', 'status' => 'open']);

        // الأدمن يُسنِد الطلب
        $this->actingAsUserWith(['requests.view', 'requests.view.all', 'requests.manage']);
        $this->patchJson("/api/v1/service-requests/{$req->id}", ['assigned_to' => $engineer->id])->assertOk();
        $this->assertDatabaseHas('service_requests', ['id' => $req->id, 'assigned_to' => $engineer->id]);

        // المهندس الآن يراه
        $engineer->givePermissionTo(\Spatie\Permission\Models\Permission::findOrCreate('requests.view', 'web'));
        Sanctum::actingAs($engineer);
        $res = $this->getJson('/api/v1/service-requests');
        $this->assertSame(1, $res->json('meta.total'));
    }

    public function test_status_filter_combined_with_search_stays_scoped(): void
    {
        ServiceRequest::create(['title' => 'فيلا الملقا', 'type' => 'design', 'client_name' => 'عميل', 'priority' => 'normal', 'status' => 'open']);
        ServiceRequest::create(['title' => 'فيلا النرجس', 'type' => 'design', 'client_name' => 'عميل', 'priority' => 'normal', 'status' => 'closed']);

        $this->actingAsUserWith(['requests.view', 'requests.view.all']);

        // البحث «فيلا» يطابق الاثنين، لكن فلتر الحالة open يجب أن يُبقي واحدًا فقط
        $res = $this->getJson('/api/v1/service-requests?search=' . urlencode('فيلا') . '&status=open');

        $res->assertOk();
        $this->assertSame(1, $res->json('meta.total'));
        $this->assertSame('فيلا الملقا', $res->json('data.0.title'));
    }

    public function test_engineer_cannot_access_page_without_requests_view_permission(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/service-requests')->assertForbidden();
    }

    public function test_portal_created_request_appears_in_incoming_requests_for_admin(): void
    {
        // العميل يُرسل طلبًا من البوابة
        $contact = Contact::factory()->create(['full_name' => 'خالد العنزي', 'phone' => '+96599112233']);
        $clientUser = User::factory()->create(['contact_id' => $contact->id]);
        Sanctum::actingAs($clientUser);
        $this->postJson('/api/v1/client-portal/requests', ['type' => 'project', 'project_name' => 'فيلا سكنية'])->assertCreated();

        // الأدمن يراه في صفحة الطلبات الواردة
        $this->actingAsUserWith(['requests.view', 'requests.view.all']);
        $res = $this->getJson('/api/v1/service-requests');
        $res->assertOk();
        $this->assertGreaterThanOrEqual(1, $res->json('meta.total'));
        $titles = collect($res->json('data'))->pluck('title')->implode(' | ');
        $this->assertStringContainsString('فيلا سكنية', $titles);
    }
}
