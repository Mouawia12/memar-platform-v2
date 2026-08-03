<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClientPortalRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_linked_client_can_submit_a_project_request(): void
    {
        $contact = Contact::factory()->create(['full_name' => 'أحمد العلي', 'phone' => '+96599990000']);
        $user = User::factory()->create(['contact_id' => $contact->id]);
        Sanctum::actingAs($user);

        $res = $this->postJson('/api/v1/client-portal/requests', [
            'type' => 'project',
            'note' => 'أرغب ببدء تصميم فيلا سكنية.',
        ]);

        $res->assertCreated();
        $this->assertDatabaseHas('service_requests', [
            'client_name' => 'أحمد العلي',
            'requested_by' => $user->id,
            'status' => 'open',
            'type' => 'design',
        ]);
    }

    public function test_project_request_form_details_are_composed_into_the_request(): void
    {
        $contact = Contact::factory()->create(['full_name' => 'سارة المطيري', 'phone' => '+96555550000']);
        $user = User::factory()->create(['contact_id' => $contact->id]);
        Sanctum::actingAs($user);

        $res = $this->postJson('/api/v1/client-portal/requests', [
            'type' => 'project',
            'project_name' => 'فيلا سكنية - حي الرقة',
            'project_type' => 'فيلا سكنية',
            'location' => 'الكويت - الرقة',
            'area_sqm' => 500,
            'budget_range' => '100 – 250 ألف د.ك',
            'start_date' => '2026-09-01',
            'services' => ['تصميم معماري', 'إشراف هندسي'],
            'note' => 'يفضّل طابع عصري.',
        ]);

        $res->assertCreated();

        // العنوان يحمل اسم المشروع، والوصف يجمع كل الحقول ليقرأها الطاقم.
        $req = ServiceRequest::latest('id')->first();
        $this->assertNotNull($req);
        $this->assertSame('طلب مشروع جديد — فيلا سكنية - حي الرقة', $req->title);
        $this->assertStringContainsString('نوع المشروع: فيلا سكنية', (string) $req->description);
        $this->assertStringContainsString('المساحة التقريبية (م²): 500', (string) $req->description);
        $this->assertStringContainsString('الخدمات المطلوبة: تصميم معماري، إشراف هندسي', (string) $req->description);
        $this->assertStringContainsString('مصدر الطلب: بوابة العميل', (string) $req->description);
    }

    public function test_project_request_spawns_a_crm_lead_opportunity(): void
    {
        $owner = User::factory()->create();
        $contact = Contact::factory()->create([
            'full_name' => 'خالد الفهد', 'phone' => '+96599991111',
            'company' => 'مجموعة الفهد', 'position' => 'مالك الشركة',
            'type' => 'client', 'owner_id' => $owner->id,
        ]);
        $user = User::factory()->create(['contact_id' => $contact->id]);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/client-portal/requests', [
            'type' => 'project',
            'project_name' => 'برج مكتبي - المرقاب',
            'project_type' => 'برج تجاري',
        ])->assertCreated();

        // فرصة CRM جديدة (عميل محتمل بمرحلة «جديد») ظهرت للمبيعات — منفصلة عن سجل العميل الأصلي.
        $this->assertDatabaseHas('contacts', [
            'full_name' => 'خالد الفهد',
            'type' => 'lead',
            'stage' => 'new',
            'project_name' => 'برج مكتبي - المرقاب',
            'owner_id' => $owner->id,
        ]);
        // العميل الأصلي لم يتغيّر نوعه.
        $this->assertDatabaseHas('contacts', ['id' => $contact->id, 'type' => 'client']);
    }

    public function test_duplicate_project_request_does_not_spawn_a_second_lead(): void
    {
        $contact = Contact::factory()->create(['phone' => '+96599992222', 'type' => 'client']);
        $user = User::factory()->create(['contact_id' => $contact->id]);
        Sanctum::actingAs($user);

        $payload = ['type' => 'project', 'project_name' => 'فيلا - الدسمة'];
        $this->postJson('/api/v1/client-portal/requests', $payload)->assertCreated();
        $this->postJson('/api/v1/client-portal/requests', $payload)->assertCreated();

        $this->assertSame(1, Contact::where('type', 'lead')->where('stage', 'new')
            ->where('project_name', 'فيلا - الدسمة')->count());
    }

    public function test_meeting_request_does_not_spawn_a_crm_lead(): void
    {
        $contact = Contact::factory()->create(['phone' => '+96599993333', 'type' => 'client']);
        Sanctum::actingAs(User::factory()->create(['contact_id' => $contact->id]));

        $this->postJson('/api/v1/client-portal/requests', ['type' => 'meeting'])->assertCreated();

        $this->assertSame(0, Contact::where('type', 'lead')->count());
    }

    public function test_client_can_attach_a_file_to_their_request(): void
    {
        Storage::fake('local');
        $contact = Contact::factory()->create();
        $user = User::factory()->create(['contact_id' => $contact->id]);
        Sanctum::actingAs($user);

        $req = ServiceRequest::create(['title' => 'طلب مشروع جديد', 'type' => 'design', 'status' => 'open', 'requested_by' => $user->id]);

        $res = $this->postJson("/api/v1/client-portal/requests/{$req->id}/attachments", [
            'file' => UploadedFile::fake()->create('صك-ملكية.pdf', 200, 'application/pdf'),
        ]);

        $res->assertCreated();
        $this->assertDatabaseHas('stored_files', [
            'service_request_id' => $req->id,
            'contact_id' => $contact->id,
            'original_name' => 'صك-ملكية.pdf',
        ]);
    }

    public function test_client_cannot_attach_to_another_clients_request(): void
    {
        Storage::fake('local');
        $mine = User::factory()->create(['contact_id' => Contact::factory()->create()->id]);
        $otherReq = ServiceRequest::create(['title' => 'طلب آخر', 'type' => 'design', 'status' => 'open', 'requested_by' => User::factory()->create()->id]);
        Sanctum::actingAs($mine);

        $this->postJson("/api/v1/client-portal/requests/{$otherReq->id}/attachments", [
            'file' => UploadedFile::fake()->create('x.pdf', 10, 'application/pdf'),
        ])->assertForbidden();
    }

    public function test_dangerous_attachment_extension_is_rejected(): void
    {
        Storage::fake('local');
        $user = User::factory()->create(['contact_id' => Contact::factory()->create()->id]);
        $req = ServiceRequest::create(['title' => 'طلب', 'type' => 'design', 'status' => 'open', 'requested_by' => $user->id]);
        Sanctum::actingAs($user);

        $this->postJson("/api/v1/client-portal/requests/{$req->id}/attachments", [
            'file' => UploadedFile::fake()->create('evil.php', 10),
        ])->assertStatus(422);
    }

    public function test_unlinked_user_cannot_submit(): void
    {
        $user = User::factory()->create(['contact_id' => null]);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/client-portal/requests', ['type' => 'meeting'])->assertForbidden();
    }

    public function test_invalid_type_is_rejected(): void
    {
        $contact = Contact::factory()->create();
        Sanctum::actingAs(User::factory()->create(['contact_id' => $contact->id]));

        $this->postJson('/api/v1/client-portal/requests', ['type' => 'hack'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('type');
    }
}
