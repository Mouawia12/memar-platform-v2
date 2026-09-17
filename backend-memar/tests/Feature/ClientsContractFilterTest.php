<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Contract;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * فلتر التعاقد في سجل العملاء (طلب أيمن 2026-09-17): «أظهر العملاء اللي موقّعين
 * عقود، والعملاء اللي تواصلوا معنا بس وما فيش عقد رسمي ما بيننا».
 * المسودة لا تُحتسب — كل مشروع يُنشئ مسودة عقد تلقائيًّا.
 */
class ClientsContractFilterTest extends TestCase
{
    use RefreshDatabase;

    private function contact(string $name): Contact
    {
        return Contact::create(['full_name' => $name, 'type' => 'client', 'stage' => 'new']);
    }

    private function contract(Contact $c, string $status, float $value = 1000): Contract
    {
        $project = Project::create(['name' => "مشروع {$c->full_name}", 'status' => 'active', 'client_id' => $c->id]);

        // مشروع جديد يولّد مسودة عقد تلقائيًّا؛ نستعملها ونضبط حالتها بدل إنشاء ثانٍ.
        $contract = Contract::where('project_id', $project->id)->first()
            ?? Contract::create(['project_id' => $project->id, 'client_id' => $c->id, 'status' => $status]);
        $contract->update(['status' => $status, 'value_kwd' => $value, 'client_id' => $c->id]);

        return $contract;
    }

    /** @return array<int, string> */
    private function names(string $query = ''): array
    {
        return array_column($this->getJson("/api/v1/contacts{$query}")->assertOk()->json('data'), 'full_name');
    }

    public function test_filters_signed_clients_from_mere_prospects(): void
    {
        $this->actingAsUserWith(['crm.view']);
        $signed = $this->contact('عميل متعاقد');
        $this->contract($signed, 'signed');
        $draft = $this->contact('عميل بمسودة');
        $this->contract($draft, 'draft');
        $this->contact('عميل تواصل فقط');

        $this->assertSame(['عميل متعاقد'], $this->names('?contract_state=contracted'));
        $this->assertEqualsCanonicalizing(['عميل بمسودة', 'عميل تواصل فقط'], $this->names('?contract_state=prospect'));
        $this->assertCount(3, $this->names(), 'بلا فلتر يظهر الجميع');
    }

    public function test_cancelled_contract_is_not_a_contract(): void
    {
        $this->actingAsUserWith(['crm.view']);
        $c = $this->contact('عقد ملغى');
        $this->contract($c, 'cancelled');

        $this->assertSame([], $this->names('?contract_state=contracted'));
        $this->assertSame(['عقد ملغى'], $this->names('?contract_state=prospect'));
    }

    public function test_badge_reaches_everyone_but_the_total_stays_financial(): void
    {
        Permission::findOrCreate('clients.finance.view', 'web');
        $this->actingAsUserWith(['crm.view']);   // بلا صلاحية مالية
        $c = $this->contact('عميل متعاقد');
        $this->contract($c, 'active', 2500);

        $row = $this->getJson('/api/v1/contacts')->assertOk()->json('data.0');
        $this->assertTrue($row['has_signed_contract'], 'شارة التعاقد تصل للجميع');
        $this->assertArrayNotHasKey('contracts_total_kwd', $row, 'المبلغ يبقى للمالية وحدها');
    }

    public function test_total_counts_signed_contracts_only(): void
    {
        $this->actingAsUserWith(['crm.view', 'clients.finance.view']);
        $c = $this->contact('عميل');
        $this->contract($c, 'active', 2500);
        $draftProject = Project::create(['name' => 'مشروع بمسودة', 'status' => 'active', 'client_id' => $c->id]);
        Contract::where('project_id', $draftProject->id)->update(['status' => 'draft', 'value_kwd' => 9000, 'client_id' => $c->id]);

        $row = $this->getJson('/api/v1/contacts')->assertOk()->json('data.0');
        $this->assertSame(2500.0, (float) $row['contracts_total_kwd'], 'المسودة لا تُضاف إلى الإجمالي');
    }

    public function test_unknown_state_is_ignored(): void
    {
        $this->actingAsUserWith(['crm.view']);
        $this->contact('أ');
        $this->contact('ب');

        $this->assertCount(2, $this->names('?contract_state=whatever'));
    }
}
