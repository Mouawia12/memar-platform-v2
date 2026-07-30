<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\AppointmentResource;
use App\Http\Resources\ContractResource;
use App\Http\Resources\GeneratedDocumentResource;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\ProjectStageResource;
use App\Models\Appointment;
use App\Models\Contract;
use App\Models\GeneratedDocument;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * بوابة العميل — يرى العميل بيانات سجلّه فقط (مشاريعه، فواتيره، عقوده، مستنداته، اجتماعاته).
 * الربط عبر users.contact_id → contacts.id.
 */
class ClientPortalController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $contactId = $request->user()?->contact_id;

        // حساب غير مرتبط بسجل عميل — نُرجع حالة واضحة بدل خطأ
        if (! $contactId) {
            return $this->ok([
                'linked' => false,
                'client' => null,
                'stats' => null,
                'projects' => [],
                'invoices' => [],
                'contracts' => [],
                'documents' => [],
                'appointments' => [],
            ]);
        }

        $projectIds = Project::where('client_id', $contactId)->pluck('id');

        $projects = Project::where('client_id', $contactId)
            ->with(['manager:id,name', 'client:id,full_name'])
            ->latest()
            ->get();

        $invoices = Invoice::where('client_id', $contactId)
            ->with(['project:id,name', 'client:id,full_name'])
            ->latest()
            ->get();

        $contracts = Contract::where('client_id', $contactId)
            ->with(['project:id,name', 'client:id,full_name'])
            ->latest()
            ->get();

        $documents = GeneratedDocument::whereIn('project_id', $projectIds)
            ->with(['template', 'project'])
            ->latest()
            ->limit(20)
            ->get();

        $appointments = Appointment::whereIn('project_id', $projectIds)
            ->where('start_at', '>=', now()->startOfDay())
            ->where('status', 'scheduled')
            ->with('project:id,name')
            ->orderBy('start_at')
            ->limit(10)
            ->get();

        $totalDue = (float) $invoices->sum(fn (Invoice $i) => (float) $i->total_kwd - (float) $i->paid_kwd);

        return $this->ok([
            'linked' => true,
            'client' => [
                'id' => $contactId,
                'name' => $request->user()?->contact?->full_name,
            ],
            'stats' => [
                'projects' => $projects->count(),
                'active_projects' => $projects->where('status', 'active')->count(),
                'invoices' => $invoices->count(),
                'total_due' => round($totalDue, 3),
                'contracts' => $contracts->count(),
            ],
            'projects' => ProjectResource::collection($projects),
            'invoices' => InvoiceResource::collection($invoices),
            'contracts' => ContractResource::collection($contracts),
            'documents' => GeneratedDocumentResource::collection($documents),
            'appointments' => AppointmentResource::collection($appointments),
        ]);
    }

    /**
     * تفاصيل مشروع للعميل (CLIENT-4): مراحله وتقدّمه ودفعاته — مقصورة على مشروعه هو،
     * وبلا أي بيانات داخلية (لا تقييم، لا ملاحظات سرّية، لا محادثات مراحل).
     */
    public function project(Request $request, Project $project): JsonResponse
    {
        $contactId = $request->user()?->contact_id;
        abort_unless($contactId !== null && $project->client_id === $contactId, 403, 'لا صلاحية لك على هذا المشروع.');

        // المراحل بلا محادثة (لا نُحمّل comments) — العميل يرى التقدّم فقط.
        $stages = $project->stages()->get();
        $doneStages = $stages->where('status', 'done')->count();
        $stageProgress = $stages->count() > 0 ? (int) round($doneStages / $stages->count() * 100) : 0;

        $invoices = Invoice::where('project_id', $project->id)->with('project:id,name')->latest()->get();
        $invoiced = round((float) $invoices->sum('total_kwd'), 3);
        $paid = round((float) $invoices->sum('paid_kwd'), 3);

        $project->load(['manager:id,name']);

        return $this->ok([
            'project' => [
                'id' => $project->id,
                'code' => $project->code,
                'name' => $project->name,
                'status' => $project->status,
                'start_date' => $project->start_date?->toDateString(),
                'end_date' => $project->end_date?->toDateString(),
                'manager' => $project->manager?->name,
                'stage_progress' => $stageProgress,
            ],
            'stages' => ProjectStageResource::collection($stages),
            'payments' => [
                'invoiced_kwd' => $invoiced,
                'paid_kwd' => $paid,
                'remaining_kwd' => round($invoiced - $paid, 3),
                'invoices' => InvoiceResource::collection($invoices),
            ],
        ]);
    }

    /**
     * طلب من العميل من بوابته (CLIENT-2): مشروع جديد / حجز اجتماع / استفسار.
     * يُنشئ طلبًا واردًا (ServiceRequest) يظهر لدى الطاقم.
     */
    public function submitRequest(Request $request): JsonResponse
    {
        $user = $request->user();
        $contact = $user?->contact;
        abort_unless($contact !== null, 403, 'الحساب غير مرتبط بسجل عميل.');

        $data = $request->validate([
            'type' => ['required', Rule::in(['project', 'meeting', 'inquiry'])],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        $map = [
            'project' => ['title' => 'طلب مشروع جديد', 'type' => 'design'],
            'meeting' => ['title' => 'طلب حجز اجتماع', 'type' => 'inquiry'],
            'inquiry' => ['title' => 'استفسار', 'type' => 'inquiry'],
        ];
        $m = $map[$data['type']];

        $req = ServiceRequest::create([
            'title' => $m['title'].' — '.$contact->full_name,
            'type' => $m['type'],
            'client_name' => $contact->full_name,
            'contact_phone' => $contact->phone,
            'priority' => 'high',
            'status' => 'open',
            'description' => trim(($data['note'] ?? '')."\nمصدر الطلب: بوابة العميل"),
            'requested_by' => $user->id,
        ]);

        return $this->created(['id' => $req->id], 'تم إرسال طلبك — سنتواصل معك قريبًا.');
    }
}
