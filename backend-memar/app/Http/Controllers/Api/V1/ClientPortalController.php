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
use App\Models\Contact;
use App\Models\Contract;
use App\Models\GeneratedDocument;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\Referral;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
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

        $contact = $request->user()?->contact;
        $doneProjects = $projects->where('status', 'done')->count();

        return $this->ok([
            'linked' => true,
            'client' => [
                'id' => $contactId,
                'name' => $contact?->full_name,
                'kunya' => $contact?->kunya,
                'company' => $contact?->company,
                'phone' => $contact?->phone,
                'since' => $contact?->created_at?->format('Y'),
                'notification_prefs' => $contact?->notification_prefs ?? Contact::DEFAULT_NOTIFICATION_PREFS,
            ],
            'stats' => [
                'projects' => $projects->count(),
                'active_projects' => $projects->where('status', 'active')->count(),
                'done_projects' => $doneProjects,
                'invoices' => $invoices->count(),
                'unpaid_invoices' => $invoices->filter(fn (Invoice $i) => (float) $i->total_kwd - (float) $i->paid_kwd > 0)->count(),
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

    /** طلباتي — قائمة طلبات العميل الواردة التي أرسلها من بوابته. */
    public function myRequests(Request $request): JsonResponse
    {
        $labels = ['open' => 'قيد المراجعة', 'in_progress' => 'قيد التنفيذ', 'resolved' => 'تمّت المعالجة', 'closed' => 'مغلق'];

        $requests = ServiceRequest::where('requested_by', $request->user()->id)
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (ServiceRequest $r) => [
                'id' => $r->id,
                'title' => $r->title,
                'status' => $r->status,
                'status_label' => $labels[$r->status] ?? $r->status,
                'description' => $r->description,
                'created_at' => $r->created_at?->toIso8601String(),
            ])->all();

        return $this->ok($requests);
    }

    /** إشعارات العميل — بنود تحتاج انتباهه (فواتير مستحقّة، مواعيد قادمة، طلبات مفتوحة). */
    public function notifications(Request $request): JsonResponse
    {
        $user = $request->user();
        $contactId = $user?->contact_id;
        $items = [];

        if ($contactId) {
            $unpaid = Invoice::where('client_id', $contactId)
                ->get()
                ->filter(fn (Invoice $i) => (float) $i->total_kwd - (float) $i->paid_kwd > 0);
            foreach ($unpaid as $inv) {
                $bal = round((float) $inv->total_kwd - (float) $inv->paid_kwd, 3);
                $items[] = ['icon' => 'fa-file-invoice', 'kind' => 'warning', 'title' => 'فاتورة بانتظار السداد', 'text' => ($inv->number ?? '#'.$inv->id).' — '.number_format($bal, 0).' د.ك', 'at' => $inv->due_date?->toDateString()];
            }

            $projectIds = Project::where('client_id', $contactId)->pluck('id');
            $next = Appointment::whereIn('project_id', $projectIds)
                ->where('status', 'scheduled')
                ->where('start_at', '>=', now())
                ->orderBy('start_at')
                ->limit(5)
                ->get();
            foreach ($next as $a) {
                $items[] = ['icon' => 'fa-calendar-check', 'kind' => 'info', 'title' => 'موعد قادم', 'text' => $a->title, 'at' => $a->start_at?->toIso8601String()];
            }
        }

        $openReqs = ServiceRequest::where('requested_by', $user->id)->where('status', 'open')->count();
        if ($openReqs > 0) {
            $items[] = ['icon' => 'fa-clipboard-list', 'kind' => 'info', 'title' => 'طلبات قيد المراجعة', 'text' => "{$openReqs} طلب بانتظار ردّ فريقنا", 'at' => null];
        }

        return $this->ok(['count' => count($items), 'items' => $items]);
    }

    /** إعدادات العميل — تحديث بياناته الشخصية (الاسم، الهاتف، الشركة). */
    public function updateProfile(Request $request): JsonResponse
    {
        $contact = $request->user()?->contact;
        abort_unless($contact !== null, 403, 'الحساب غير مرتبط بسجل عميل.');

        $data = $request->validate([
            'full_name' => ['sometimes', 'required', 'string', 'max:255'],
            'kunya' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:30'],
            'company' => ['nullable', 'string', 'max:255'],
        ]);

        $contact->fill($data)->save();

        return $this->ok([
            'id' => $contact->id,
            'name' => $contact->full_name,
            'kunya' => $contact->kunya,
            'phone' => $contact->phone,
            'company' => $contact->company,
        ], 'تم حفظ بياناتك');
    }

    /** تفضيلات الإشعارات — حفظ مفاتيح (بريد/جوال/اجتماعات/فواتير) للعميل. */
    public function updatePreferences(Request $request): JsonResponse
    {
        $contact = $request->user()?->contact;
        abort_unless($contact !== null, 403, 'الحساب غير مرتبط بسجل عميل.');

        $data = $request->validate([
            'email' => ['required', 'boolean'],
            'sms' => ['required', 'boolean'],
            'meetings' => ['required', 'boolean'],
            'invoices' => ['required', 'boolean'],
        ]);

        $contact->notification_prefs = $data;
        $contact->save();

        return $this->ok($data, 'تم حفظ تفضيلاتك');
    }

    /** برنامج الولاء — كود الإحالة الثابت + إحصاءات حقيقية + سجل الإحالات. */
    public function loyalty(Request $request): JsonResponse
    {
        $contact = $request->user()?->contact;
        abort_unless($contact !== null, 403, 'الحساب غير مرتبط بسجل عميل.');

        $this->ensureReferralCode($contact);

        $referrals = $contact->referrals()->latest()->get();
        $labels = ['pending' => 'بانتظار التعاقد', 'joined' => 'فتح حساب', 'contracted' => 'مكتمل'];

        return $this->ok([
            'code' => $contact->referral_code,
            'stats' => [
                'successful' => $referrals->where('status', 'contracted')->count(),
                'gifts_sent' => $referrals->where('is_gift', true)->count(),
                'shares' => (int) $contact->referral_shares,
                'discount' => 10,
            ],
            'history' => $referrals->map(fn (Referral $r): array => [
                'id' => $r->id,
                'name' => $r->referred_name,
                'status' => $r->status,
                'status_label' => $labels[$r->status] ?? $r->status,
                'is_gift' => $r->is_gift,
            ])->all(),
        ]);
    }

    /** تسجيل مشاركة الكود (زر المشاركة/النسخ) — عدّاد حقيقي. */
    public function recordReferralShare(Request $request): JsonResponse
    {
        $contact = $request->user()?->contact;
        abort_unless($contact !== null, 403, 'الحساب غير مرتبط بسجل عميل.');

        $this->ensureReferralCode($contact);
        $contact->increment('referral_shares');

        return $this->ok([
            'code' => $contact->referral_code,
            'shares' => (int) $contact->referral_shares,
        ], 'تم تسجيل المشاركة');
    }

    /** يُولّد كود إحالة فريدًا ثابتًا للعميل مرة واحدة. */
    private function ensureReferralCode(Contact $contact): void
    {
        if ($contact->referral_code) {
            return;
        }

        do {
            $code = 'MEMAR-'.strtoupper(Str::random(6));
        } while (Contact::where('referral_code', $code)->exists());

        $contact->referral_code = $code;
        $contact->save();
    }
}
