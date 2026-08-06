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
use App\Models\ChatThread;
use App\Models\ChatThreadParticipant;
use App\Models\ClientMessage;
use App\Models\Contact;
use App\Models\Contract;
use App\Models\ForumCategory;
use App\Models\ForumReply;
use App\Models\ForumTopic;
use App\Models\GeneratedDocument;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\Referral;
use App\Models\ServiceRequest;
use App\Models\StoredFile;
use App\Models\TeamMember;
use App\Models\LoyaltyRedemption;
use App\Models\LoyaltyTransaction;
use App\Services\FileStorageService;
use App\Services\LoyaltyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
        $contact = $request->user()?->contact;

        // حساب غير مرتبط بسجل عميل — نُرجع حالة واضحة بدل خطأ
        if (! $contact) {
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

        return $this->ok($this->portalPayload($contact));
    }

    /**
     * بروفيل العميل للموظف/الأدمن (اجتماع 2026-08-05): نفس بيانات صفحة العميل تمامًا
     * + قسم داخلي (تقييم/ملاحظات) لا يراه العميل. يُقيَّد بصلاحية clients.view من الأدمن.
     */
    public function staffProfile(Contact $contact): JsonResponse
    {
        $payload = $this->portalPayload($contact);
        $payload['internal'] = [
            'rating' => $contact->internal_rating !== null ? (int) $contact->internal_rating : null,
            'notes' => $contact->internal_notes,
        ];

        return $this->ok($payload);
    }

    /** حمولة بوابة العميل لجهة اتصال — مصدر موحّد لصفحة العميل ولبروفيل الموظف. */
    private function portalPayload(Contact $contact): array
    {
        $contactId = $contact->id;

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

        // اجتماعات صفحة العميل: اجتماعات حديثة منتهية + اليوم + القادمة —
        // لتُعرض بطاقات live/upcoming/past طبق الأصل. الداشبورد يُرشّح القادمة فقط.
        $appointments = Appointment::whereIn('project_id', $projectIds)
            ->where('start_at', '>=', now()->subDays(60))
            ->whereIn('status', ['scheduled', 'done'])
            ->with('project:id,name')
            ->orderBy('start_at')
            ->limit(15)
            ->get();

        $totalDue = (float) $invoices->sum(fn (Invoice $i) => (float) $i->total_kwd - (float) $i->paid_kwd);

        $doneProjects = $projects->where('status', 'done')->count();

        return [
            'linked' => true,
            'client' => [
                'id' => $contactId,
                'name' => $contact?->full_name,
                'kunya' => $contact?->kunya,
                // المسمّى الوظيفي للشخص (مالك الشركة/مدير تنفيذي/مهندس…) — يُعرض بدل «عميل مميز» في البطاقة (طلب أيمن، اجتماع 4)
                'position' => $contact?->position,
                'company' => $contact?->company,
                // المقر الرئيسي للشركة (يظهر في بطاقات صفحة الشركة — مطابقة Atoms)
                'head_office' => $contact?->head_office,
                // نبذة الشركة (عنوان فرعي في هيرو صفحة الشركة — مطابقة Atoms)
                'company_about' => $contact?->company_about,
                'phone' => $contact?->phone,
                'since' => $contact?->created_at?->format('Y'),
                // رقم الحساب الشخصي الثابت MEE-YYYY-NNN (اجتماع 2026-08-03)
                'account_number' => $contact?->ensureAccountNumber(),
                // الصورة الشخصية كـ data URI (اجتماع 2026-08-03، بند 10) — null إن لم تُرفع بعد
                'avatar_url' => $contact ? $this->avatarDataUri($contact) : null,
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
        ];
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
        // النسبة المعروضة: القيمة المخزّنة إن وُجدت (عرض دقيق)، وإلا تُحسب من المراحل.
        $stageProgress = $project->progress ?? ($stages->count() > 0 ? (int) round($doneStages / $stages->count() * 100) : 0);

        $invoices = Invoice::where('project_id', $project->id)->with('project:id,name')->latest()->get();
        $invoiced = round((float) $invoices->sum('total_kwd'), 3);
        $paid = round((float) $invoices->sum('paid_kwd'), 3);

        $project->load(['manager:id,name']);

        return $this->ok([
            'project' => [
                'id' => $project->id,
                'code' => $project->code,
                'name' => $project->name,
                'description' => $project->description,
                'status' => $project->status,
                'start_date' => $project->start_date?->toDateString(),
                'end_date' => $project->end_date?->toDateString(),
                'manager' => $project->manager?->name,
                'stage_progress' => $stageProgress,
            ],
            // التيم الماسك للمشروع: المهندس المسؤول (طاقم معمار) + مشاركو شركة العميل (بند 11)
            'team' => $this->projectTeam($project, $contactId),
            // سجل التعديلات — من سِجِل نشاط المشروع الحقيقي (بند 11)
            'change_log' => $this->projectChangeLog($project),
            // آخر مستندات المشروع (طبق الأصل: قسم «آخر المستندات»)
            'documents' => StoredFile::where('project_id', $project->id)
                ->latest()
                ->limit(6)
                ->get()
                ->map(function (StoredFile $f): array {
                    $kind = $this->docKind($f->extension, $f->mime);

                    return [
                        'id' => $f->id,
                        'name' => $f->name ?: $f->original_name,
                        'kind' => $kind,                                            // لأيقونة البطاقة
                        'ext' => strtoupper((string) ($f->extension ?: $kind)),      // وسم النوع المعروض (PDF/DWG/PNG)
                        'size' => (int) $f->size,
                        'at' => $f->created_at?->toIso8601String(),
                    ];
                })->all(),
            'stages' => ProjectStageResource::collection($stages),
            'payments' => [
                'invoiced_kwd' => $invoiced,
                'paid_kwd' => $paid,
                'remaining_kwd' => round($invoiced - $paid, 3),
                'invoices' => InvoiceResource::collection($invoices),
            ],
        ]);
    }

    /** نوع المستند من الامتداد/الـmime — لاختيار أيقونة بطاقة المستند (pdf/dwg/img/doc). */
    private function docKind(?string $ext, ?string $mime): string
    {
        $e = strtolower((string) $ext);
        if ($e === 'pdf' || str_contains((string) $mime, 'pdf')) {
            return 'pdf';
        }
        if (in_array($e, ['dwg', 'dxf'], true)) {
            return 'dwg';
        }
        if (in_array($e, ['png', 'jpg', 'jpeg', 'webp', 'gif'], true) || str_contains((string) $mime, 'image')) {
            return 'img';
        }

        return 'doc';
    }

    /**
     * التيم الظاهر للعميل على صفحة مشروعه: المهندس المسؤول من معمار (قائد) + مشاركو شركة العميل.
     *
     * @return list<array{name: string, role: string, is_lead: bool, added_at: string|null}>
     */
    private function projectTeam(Project $project, int $contactId): array
    {
        // مشاركو شركة العميل (طبق الأصل): المالك أولاً ثم أعضاء الفريق — والمهندس المسؤول يظهر في الهيرو.
        $team = [];
        $contact = Contact::find($contactId);
        if ($contact) {
            $team[] = ['name' => $contact->full_name, 'role' => $contact->position ?: 'مالك الشركة', 'is_lead' => true, 'added_at' => ($project->start_date ?? $project->created_at)?->toDateString()];
        }
        foreach (TeamMember::where('contact_id', $contactId)->oldest()->get() as $m) {
            $team[] = ['name' => $m->name, 'role' => $m->role, 'is_lead' => false, 'added_at' => $m->created_at?->toDateString()];
        }

        return $team;
    }

    /**
     * سجل تعديلات المشروع للعميل — يُترجم آخر أحداث سجل النشاط إلى أسطر عربية مقروءة.
     *
     * @return list<array{text: string, at: string|null}>
     */
    private function projectChangeLog(Project $project): array
    {
        $fieldLabels = [
            'status' => 'حالة المشروع',
            'name' => 'اسم المشروع',
            'code' => 'رقم المشروع',
            'manager_id' => 'المهندس المسؤول',
            'budget_kwd' => 'الميزانية',
            'is_vip' => 'تمييز المشروع',
        ];

        return $project->activities()->latest('id')->limit(12)->get()
            ->map(function ($activity) use ($fieldLabels): array {
                $text = match ($activity->description) {
                    'created' => 'تم إنشاء المشروع',
                    'deleted' => 'تم حذف المشروع',
                    default => (function () use ($activity, $fieldLabels): string {
                        $changed = array_keys((array) ($activity->properties['attributes'] ?? []));
                        $labels = array_values(array_intersect_key($fieldLabels, array_flip($changed)));

                        return $labels === [] ? 'تحديث بيانات المشروع' : 'تحديث: '.implode('، ', $labels);
                    })(),
                };

                return ['text' => $text, 'at' => $activity->created_at?->toIso8601String()];
            })->all();
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
            'type' => ['required', Rule::in(['project', 'meeting', 'inquiry', 'modification'])],
            'note' => ['nullable', 'string', 'max:2000'],
            // تفاصيل طلب المشروع الجديد (اختيارية — تُملأ من نموذج «طلب مشروع جديد»)
            'project_name' => ['nullable', 'string', 'max:200'],
            'project_type' => ['nullable', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:200'],
            'area_sqm' => ['nullable', 'numeric', 'min:0', 'max:9999999'],
            'budget_range' => ['nullable', 'string', 'max:100'],
            'start_date' => ['nullable', 'date'],
            'services' => ['nullable', 'array', 'max:20'],
            'services.*' => ['string', 'max:60'],
            // طلب تعديل/إضافة على مشروع قائم (نموذج «طلب جديد» البسيط — مطابق لتصميم Atoms)
            'project_id' => ['nullable', 'integer'],
            'request_type' => ['nullable', Rule::in(['modify', 'add', 'remove', 'material', 'other'])],
            'title' => ['nullable', 'string', 'max:200'],
        ]);

        $map = [
            'project' => ['title' => 'طلب مشروع جديد', 'type' => 'design'],
            'meeting' => ['title' => 'طلب حجز اجتماع', 'type' => 'inquiry'],
            'inquiry' => ['title' => 'استفسار', 'type' => 'inquiry'],
            'modification' => ['title' => 'طلب تعديل', 'type' => 'maintenance'],
        ];
        $m = $map[$data['type']];

        if ($data['type'] === 'modification') {
            [$title, $description] = $this->composeModificationRequest($contact, $data);
        } else {
            // عنوان يحمل اسم المشروع إن وُجد — ليظهر واضحًا في «الطلبات» ولدى المبيعات.
            $projectName = trim((string) ($data['project_name'] ?? ''));
            $title = $m['title'].' — '.($projectName !== '' ? $projectName : $contact->full_name);
            $description = $this->composeRequestDescription($data);
        }

        // ربط الطلب بمشروع قائم (لطلبات التعديل/الإضافة) إن كان يخصّ العميل — يظهر في ميتا «طلباتي».
        $projectId = null;
        if (! empty($data['project_id'])) {
            $projectId = Project::where('id', $data['project_id'])->where('client_id', $contact->id)->value('id');
        }

        $req = ServiceRequest::create([
            'title' => $title,
            'type' => $m['type'],
            'client_name' => $contact->full_name,
            'contact_phone' => $contact->phone,
            'priority' => $data['type'] === 'modification' ? 'normal' : 'high',
            'status' => 'open',
            'description' => $description,
            'requested_by' => $user->id,
            'project_id' => $projectId,
        ]);

        // طلب مشروع جديد يظهر أيضًا لدى المبيعات كفرصة في لوحة CRM (اجتماع 2026-08-03، بند 2).
        if ($data['type'] === 'project') {
            $this->spawnNewProjectOpportunity($contact, $data);
        }

        return $this->created(['id' => $req->id], 'تم إرسال طلبك — سنتواصل معك قريبًا.');
    }

    /**
     * يصوغ عنوان ووصف «طلب جديد» البسيط (تعديل/إضافة على مشروع قائم — مطابق لتصميم Atoms).
     * يتحقّق أن المشروع المختار يخصّ العميل نفسه.
     *
     * @param  array<string, mixed>  $data
     * @return array{0: string, 1: string}
     */
    private function composeModificationRequest(Contact $contact, array $data): array
    {
        $requestTypeLabels = [
            'modify' => 'تعديل تصميم',
            'add' => 'إضافة عنصر',
            'remove' => 'حذف عنصر',
            'material' => 'تغيير مواد',
            'other' => 'أخرى',
        ];

        $projectName = null;
        if (! empty($data['project_id'])) {
            $project = Project::where('id', $data['project_id'])->where('client_id', $contact->id)->first();
            abort_if($project === null, 422, 'المشروع المحدّد غير موجود ضمن مشاريعك.');
            $projectName = $project->name;
        }

        $clientTitle = trim((string) ($data['title'] ?? ''));
        $title = 'طلب تعديل'.($clientTitle !== '' ? ' — '.$clientTitle : '');

        $lines = [];
        if ($projectName !== null) {
            $lines[] = 'المشروع: '.$projectName;
        }
        if (! empty($data['request_type'])) {
            $lines[] = 'نوع الطلب: '.$requestTypeLabels[$data['request_type']];
        }
        if ($clientTitle !== '') {
            $lines[] = 'عنوان الطلب: '.$clientTitle;
        }
        $details = trim((string) ($data['note'] ?? ''));
        if ($details !== '') {
            $lines[] = 'التفاصيل: '.$details;
        }
        $lines[] = 'مصدر الطلب: بوابة العميل';

        return [$title, implode("\n", $lines)];
    }

    /**
     * يُنشئ فرصة CRM (عميل محتمل بمرحلة «جديد») لطلب مشروع جديد وارد من عميل قائم في بوابته،
     * لتظهر لدى المبيعات في اللوحة إلى جانب «الطلبات». لا يعدّل سجل العميل الأصلي.
     * مانع تكرار: لا يُنشئ فرصة ثانية مفتوحة بنفس الهاتف واسم المشروع في مرحلة «جديد».
     *
     * @param  array<string, mixed>  $data
     */
    private function spawnNewProjectOpportunity(Contact $client, array $data): ?Contact
    {
        $projectName = trim((string) ($data['project_name'] ?? '')) ?: null;

        $duplicate = Contact::query()
            ->where('type', 'lead')
            ->where('stage', 'new')
            ->where('phone', $client->phone)
            ->where('project_name', $projectName)
            ->exists();

        if ($duplicate) {
            return null;
        }

        return Contact::create([
            'full_name' => $client->full_name,
            'kunya' => $client->kunya,
            'phone' => $client->phone,
            'email' => $client->email,
            'company' => $client->company,
            'position' => $client->position,
            'type' => 'lead',
            'status' => 'active',
            'stage' => 'new',
            'temperature' => 'warm', // عميل قائم متفاعل — فرصة دافئة
            'project_name' => $projectName,
            'project_details' => $this->composeRequestDescription($data),
            'owner_id' => $client->owner_id,
            'notes' => 'طلب مشروع جديد من عميل قائم عبر البوابة'
                .($client->account_number ? ' — رقم الحساب '.$client->account_number : ''),
        ]);
    }

    /** الامتدادات المسموحة لمرفقات الطلب (صك ملكية، كروكي، صور الموقع، مخططات). */
    private const ATTACHMENT_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'dwg', 'dxf'];

    /**
     * رفع مرفق لطلب العميل (صك ملكية/كروكي/صور) — مقصور على طلبات العميل نفسه.
     * حد أقصى 25MB لكل ملف، وامتدادات آمنة فقط.
     */
    public function uploadRequestAttachment(Request $request, ServiceRequest $serviceRequest, FileStorageService $files): JsonResponse
    {
        $user = $request->user();
        abort_unless($serviceRequest->requested_by === $user?->id, 403, 'لا صلاحية لك على هذا الطلب.');

        $request->validate([
            'file' => ['required', 'file', 'max:25600'], // 25MB بالكيلوبايت
        ]);

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());
        abort_if(in_array($ext, FileStorageService::BLOCKED_EXTENSIONS, true), 422, 'نوع الملف غير مسموح.');
        abort_unless(in_array($ext, self::ATTACHMENT_EXTENSIONS, true), 422, 'الصيغ المدعومة: PDF, JPG, PNG, DWG.');

        $stored = $files->store($file, [
            'folder' => 'طلبات العملاء',
            'service_request_id' => $serviceRequest->id,
            'contact_id' => $user->contact_id,
        ], $user->id);

        return $this->created([
            'id' => $stored->id,
            'original_name' => $stored->original_name,
            'size' => $stored->size,
        ], 'تم رفع المرفق.');
    }

    /** الصيغ المسموحة للصورة الشخصية. */
    private const AVATAR_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

    /**
     * رفع/تغيير الصورة الشخصية للعميل (اجتماع 2026-08-03، بند 10).
     * صور فقط، حد أقصى 3MB. تُحذف الصورة القديمة عند الاستبدال.
     */
    public function uploadAvatar(Request $request, FileStorageService $files): JsonResponse
    {
        $contact = $request->user()?->contact;
        abort_unless($contact !== null, 403, 'الحساب غير مرتبط بسجل عميل.');

        $request->validate([
            'file' => ['required', 'file', 'image', 'max:3072'], // 3MB
        ]);

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());
        abort_unless(in_array($ext, self::AVATAR_EXTENSIONS, true), 422, 'الصيغ المدعومة: JPG, PNG, WEBP.');

        $old = $contact->avatarFile; // نحذفها بعد نجاح الحفظ

        $stored = $files->store($file, [
            'folder' => 'صور العملاء',
            'contact_id' => $contact->id,
        ], $request->user()->id);

        $contact->avatar_file_id = $stored->id;
        $contact->save();

        if ($old) {
            $files->delete($old);
        }

        return $this->created(['avatar_url' => $this->avatarDataUri($contact->refresh())], 'تم تحديث صورتك الشخصية.');
    }

    /** حذف الصورة الشخصية للعميل. */
    public function deleteAvatar(Request $request, FileStorageService $files): JsonResponse
    {
        $contact = $request->user()?->contact;
        abort_unless($contact !== null, 403, 'الحساب غير مرتبط بسجل عميل.');

        $avatar = $contact->avatarFile;
        if ($avatar) {
            $contact->avatar_file_id = null;
            $contact->save();
            $files->delete($avatar);
        }

        return $this->ok(null, 'تم حذف صورتك الشخصية.');
    }

    /**
     * يبني data URI للصورة الشخصية من الملف المخزّن على القرص الخاص،
     * ليعرضه المتصفّح مباشرةً في <img> دون نقطة تنزيل محميّة إضافية.
     */
    private function avatarDataUri(Contact $contact): ?string
    {
        $file = $contact->avatarFile;
        if (! $file || ! Storage::disk($file->disk)->exists($file->path)) {
            return null;
        }

        $mime = $file->mime ?: 'image/jpeg';

        return 'data:'.$mime.';base64,'.base64_encode(Storage::disk($file->disk)->get($file->path));
    }

    /**
     * يصوغ وصفًا منظّمًا للطلب من حقول نموذج «طلب مشروع جديد» — ليقرأه الطاقم في «الطلبات».
     *
     * @param  array<string, mixed>  $data
     */
    private function composeRequestDescription(array $data): string
    {
        $lines = [];
        $add = function (string $label, ?string $value) use (&$lines): void {
            $value = trim((string) $value);
            if ($value !== '') {
                $lines[] = "{$label}: {$value}";
            }
        };

        $add('نوع المشروع', $data['project_type'] ?? null);
        $add('الموقع', $data['location'] ?? null);
        $add('المساحة التقريبية (م²)', isset($data['area_sqm']) ? (string) $data['area_sqm'] : null);
        $add('الميزانية التقديرية', $data['budget_range'] ?? null);
        $add('الموعد المتوقع للبدء', $data['start_date'] ?? null);

        $services = array_values(array_filter((array) ($data['services'] ?? []), fn ($s) => trim((string) $s) !== ''));
        if ($services !== []) {
            $lines[] = 'الخدمات المطلوبة: '.implode('، ', $services);
        }

        $note = trim((string) ($data['note'] ?? ''));
        if ($note !== '') {
            $lines[] = 'ملاحظات إضافية: '.$note;
        }

        $lines[] = 'مصدر الطلب: بوابة العميل';

        return implode("\n", $lines);
    }

    /** طلباتي — قائمة طلبات العميل الواردة التي أرسلها من بوابته. */
    public function myRequests(Request $request): JsonResponse
    {
        // تسميات حالة الطلب للعميل — طبق الأصل من Atoms (قيد المراجعة/تمت الموافقة/مكتمل).
        $labels = ['open' => 'قيد المراجعة', 'in_progress' => 'تمت الموافقة', 'resolved' => 'مكتمل', 'closed' => 'مكتمل'];

        $requests = ServiceRequest::where('requested_by', $request->user()->id)
            ->with(['files', 'project:id,name'])
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (ServiceRequest $r) => [
                'id' => $r->id,
                'title' => $r->title,
                'status' => $r->status,
                'status_label' => $labels[$r->status] ?? $r->status,
                'description' => $r->description,
                // ميتا بطاقة الطلب (طبق الأصل): المشروع + الشخص (مقدّم الطلب).
                'project' => $r->project?->name,
                'person' => $r->client_name,
                'attachments' => $r->files->map(fn ($f) => [
                    'id' => $f->id,
                    'original_name' => $f->original_name,
                    'size' => $f->size,
                ])->all(),
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
    /**
     * هل المُحيل مهندس/شريك (يُحيل عملاء) بدل عميل عادي (يقترح لصديق)؟ (بند 7)
     * يُستدل من مسمّاه الوظيفي — دون احتساب أي بونص (مؤجّل).
     */
    private function isEngineerReferrer(Contact $contact): bool
    {
        $position = (string) $contact->position;

        foreach (['مهندس', 'هندس', 'شريك', 'partner', 'engineer'] as $needle) {
            if (mb_stripos($position, $needle) !== false) {
                return true;
            }
        }

        return false;
    }

    /** مسمّيات مصادر حركات النقاط للعرض. */
    private const SOURCE_LABELS = [
        'referral' => 'إحالة صديق',
        'project_completed' => 'إتمام مشروع',
        'invoice_paid' => 'سداد فاتورة',
        'signup' => 'مكافأة ترحيبية',
        'share' => 'مشاركة الكود',
        'anniversary' => 'ذكرى سنوية',
        'redeem' => 'استبدال نقاط',
        'adjust' => 'تعديل يدوي',
    ];

    private const REFERRAL_STATUS_LABELS = [
        'pending' => 'بانتظار التسجيل',
        'joined' => 'فتح حساب',
        'contracted' => 'إحالة ناجحة',
    ];

    /**
     * لوحة الولاء والإحالة الكاملة: رصيد النقاط + المستوى + رصيد الخصم المتاح +
     * سجل الحركات + الإحالات + قواعد الاستبدال + الفواتير غير المسدّدة (لتطبيق الرصيد).
     */
    public function loyalty(Request $request, LoyaltyService $loyalty): JsonResponse
    {
        $contact = $request->user()?->contact;
        abort_unless($contact !== null, 403, 'الحساب غير مرتبط بسجل عميل.');

        $loyalty->ensureReferralCode($contact);
        $contact->refresh();

        $referrals = $contact->referrals()->latest()->get();

        return $this->ok([
            'code' => $contact->referral_code,
            'referrer_kind' => $this->isEngineerReferrer($contact) ? 'engineer' : 'client',
            'points' => $loyalty->balance($contact),
            'available_credit' => $loyalty->availableCredit($contact),
            'welcome_discount' => (int) config('loyalty.welcome_discount_pct'),
            'referral_reward' => (int) config('loyalty.earn.referral_contracted'),
            'redeem' => [
                'points_per_kwd' => (int) config('loyalty.redeem.points_per_kwd'),
                'min_points' => (int) config('loyalty.redeem.min_points'),
            ],
            'tier' => $loyalty->tier($contact),
            'stats' => [
                'points' => $loyalty->balance($contact),
                'successful' => $referrals->where('status', 'contracted')->count(),
                'joined' => $referrals->where('status', 'joined')->count(),
                'shares' => (int) $contact->referral_shares,
                'discount' => (int) config('loyalty.welcome_discount_pct'),
            ],
            'referrals' => $referrals->map(fn (Referral $r): array => [
                'id' => $r->id,
                'name' => $r->referred_name,
                'status' => $r->status,
                'status_label' => self::REFERRAL_STATUS_LABELS[$r->status] ?? $r->status,
                'points_awarded' => (int) $r->points_awarded,
                'date' => ($r->contracted_at ?? $r->joined_at ?? $r->created_at)?->toIso8601String(),
            ])->values()->all(),
            'ledger' => $contact->loyaltyTransactions()->latest()->limit(30)->get()->map(fn (LoyaltyTransaction $t): array => [
                'id' => $t->id,
                'points' => $t->points,
                'balance_after' => $t->balance_after,
                'source' => $t->source,
                'source_label' => self::SOURCE_LABELS[$t->source] ?? $t->source,
                'description' => $t->description,
                'date' => $t->created_at?->toIso8601String(),
            ])->all(),
            'vouchers' => $contact->loyaltyRedemptions()->latest()->get()->map(fn (LoyaltyRedemption $v): array => [
                'code' => $v->code,
                'amount_kwd' => (float) $v->amount_kwd,
                'points_spent' => $v->points_spent,
                'status' => $v->status,
                'date' => $v->created_at?->toIso8601String(),
            ])->all(),
            'unpaid_invoices' => Invoice::where('client_id', $contact->id)
                ->whereIn('status', ['sent', 'partial'])
                ->latest('issue_date')->get()
                ->map(fn (Invoice $i): array => [
                    'id' => $i->id,
                    'number' => $i->number,
                    'due_kwd' => max(0, (float) $i->total_kwd - (float) $i->paid_kwd),
                ])->filter(fn (array $i): bool => $i['due_kwd'] > 0)->values()->all(),
        ]);
    }

    /** استبدال نقاط برصيد خصم (قسيمة). */
    public function redeemLoyalty(Request $request, LoyaltyService $loyalty): JsonResponse
    {
        $contact = $request->user()?->contact;
        abort_unless($contact !== null, 403, 'الحساب غير مرتبط بسجل عميل.');

        $data = $request->validate(['points' => ['required', 'integer', 'min:1']]);

        try {
            $voucher = $loyalty->redeem($contact, (int) $data['points']);
        } catch (\RuntimeException $e) {
            return $this->fail($e->getMessage(), 422);
        }

        return $this->ok([
            'code' => $voucher->code,
            'amount_kwd' => (float) $voucher->amount_kwd,
            'points_spent' => $voucher->points_spent,
            'balance' => $loyalty->balance($contact->refresh()),
        ], "تم استبدال {$voucher->points_spent} نقطة برصيد خصم {$voucher->amount_kwd} د.ك");
    }

    /** تطبيق قسيمة خصم متاحة على فاتورة غير مسدّدة للعميل. */
    public function applyLoyaltyCredit(Request $request, LoyaltyService $loyalty): JsonResponse
    {
        $contact = $request->user()?->contact;
        abort_unless($contact !== null, 403, 'الحساب غير مرتبط بسجل عميل.');

        $data = $request->validate([
            'voucher_code' => ['required', 'string'],
            'invoice_id' => ['required', 'integer'],
        ]);

        $voucher = LoyaltyRedemption::where('code', $data['voucher_code'])->where('contact_id', $contact->id)->first();
        $invoice = Invoice::where('id', $data['invoice_id'])->where('client_id', $contact->id)->first();
        abort_unless($voucher && $invoice, 404, 'القسيمة أو الفاتورة غير موجودة.');

        try {
            $applied = $loyalty->applyRedemptionToInvoice($voucher, $invoice);
        } catch (\RuntimeException $e) {
            return $this->fail($e->getMessage(), 422);
        }

        return $this->ok([
            'applied_kwd' => $applied,
            'invoice_status' => $invoice->refresh()->status,
        ], "طُبِّق خصم {$applied} د.ك على الفاتورة {$invoice->number}");
    }

    /** تسجيل مشاركة الكود (زر المشاركة/النسخ) — عدّاد + نقاط تفاعل مسقوفة. */
    public function recordReferralShare(Request $request, LoyaltyService $loyalty): JsonResponse
    {
        $contact = $request->user()?->contact;
        abort_unless($contact !== null, 403, 'الحساب غير مرتبط بسجل عميل.');

        $loyalty->ensureReferralCode($contact);
        $granted = $loyalty->recordShare($contact);

        return $this->ok([
            'code' => $contact->referral_code,
            'shares' => (int) $contact->refresh()->referral_shares,
            'points_granted' => $granted,
        ], 'تم تسجيل المشاركة');
    }

    // ═══ محادثات متعددة الخيوط (اجتماع 2026-08-03، بند 8) ═══

    /** يضمن وجود محادثتَي الفريق والدعم الفني، ويربط الرسائل القديمة بلا خيط بمحادثة الفريق. */
    private function ensureDefaultThreads(Contact $contact): void
    {
        if (ChatThread::where('contact_id', $contact->id)->exists()) {
            return;
        }

        $team = ChatThread::create(['contact_id' => $contact->id, 'title' => 'فريق معمار', 'kind' => 'team']);
        ChatThread::create(['contact_id' => $contact->id, 'title' => 'الدعم الفني', 'kind' => 'support']);

        // ربط أي رسائل سابقة (قبل الخيوط) بمحادثة الفريق حتى لا تضيع.
        ClientMessage::where('contact_id', $contact->id)->whereNull('chat_thread_id')->update(['chat_thread_id' => $team->id]);
    }

    private function contactOrFail(Request $request): Contact
    {
        $contact = $request->user()?->contact;
        abort_unless($contact !== null, 403, 'الحساب غير مرتبط بسجل عميل.');

        return $contact;
    }

    private function authorizeThread(Contact $contact, ChatThread $thread): void
    {
        abort_unless($thread->contact_id === $contact->id, 403, 'لا صلاحية لك على هذه المحادثة.');
    }

    /** قائمة خيوط محادثات العميل مع آخر رسالة وعدد غير المقروء والمشاركين. */
    public function chatThreads(Request $request): JsonResponse
    {
        $contact = $this->contactOrFail($request);
        $this->ensureDefaultThreads($contact);

        $threads = ChatThread::where('contact_id', $contact->id)
            ->with(['participants', 'messages' => fn ($q) => $q->latest()->limit(1)])
            ->withCount(['messages as unread_count' => fn ($q) => $q->where('from_staff', true)->whereNull('read_at')])
            ->orderByRaw("kind = 'team' desc") // الفريق أولًا
            ->latest('updated_at')
            ->get()
            ->map(fn (ChatThread $t): array => [
                'id' => $t->id,
                'title' => $t->title,
                'kind' => $t->kind,
                'can_rename' => $t->kind === 'custom',
                'unread_count' => $t->unread_count,
                'last_message' => $t->messages->first()?->body,
                'last_at' => $t->messages->first()?->created_at?->toIso8601String(),
                'participants' => $t->participants->map(fn (ChatThreadParticipant $p): array => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'role' => $p->role,
                ])->all(),
            ])->all();

        return $this->ok($threads);
    }

    /** إنشاء محادثة جديدة (بند 8: بدء محادثة جديدة). */
    public function createChatThread(Request $request): JsonResponse
    {
        $contact = $this->contactOrFail($request);
        $data = $request->validate(['title' => ['required', 'string', 'max:120']]);

        $thread = ChatThread::create(['contact_id' => $contact->id, 'title' => $data['title'], 'kind' => 'custom']);

        return $this->created(['id' => $thread->id, 'title' => $thread->title, 'kind' => $thread->kind], 'تم إنشاء المحادثة');
    }

    /** إعادة تسمية محادثة (بند 8: زر ✏️) — للمحادثات المخصّصة فقط. */
    public function renameChatThread(Request $request, ChatThread $chatThread): JsonResponse
    {
        $contact = $this->contactOrFail($request);
        $this->authorizeThread($contact, $chatThread);
        abort_if($chatThread->kind !== 'custom', 422, 'لا يمكن إعادة تسمية محادثة الفريق أو الدعم الفني.');

        $data = $request->validate(['title' => ['required', 'string', 'max:120']]);
        $chatThread->update(['title' => $data['title']]);

        return $this->ok(['id' => $chatThread->id, 'title' => $chatThread->title], 'تم تغيير اسم المحادثة');
    }

    /** رسائل خيط محدّد (مع اعتبار رسائل الطاقم مقروءة). */
    public function threadMessages(Request $request, ChatThread $chatThread): JsonResponse
    {
        $contact = $this->contactOrFail($request);
        $this->authorizeThread($contact, $chatThread);

        $chatThread->messages()->where('from_staff', true)->whereNull('read_at')->update(['read_at' => now()]);

        $messages = $chatThread->messages()->orderBy('created_at')->limit(200)->get()
            ->map(fn (ClientMessage $m): array => [
                'id' => $m->id,
                'from_staff' => $m->from_staff,
                'body' => $m->body,
                'at' => $m->created_at?->toIso8601String(),
            ])->all();

        return $this->ok($messages);
    }

    /** إرسال رسالة داخل خيط محدّد. */
    public function sendThreadMessage(Request $request, ChatThread $chatThread): JsonResponse
    {
        $contact = $this->contactOrFail($request);
        $this->authorizeThread($contact, $chatThread);
        $data = $request->validate(['body' => ['required', 'string', 'max:2000']]);

        $message = $chatThread->messages()->create([
            'contact_id' => $contact->id,
            'from_staff' => false,
            'body' => $data['body'],
            'sender_user_id' => $request->user()->id,
        ]);
        $chatThread->touch(); // لترتيب المحادثات بالأحدث

        return $this->created([
            'id' => $message->id,
            'from_staff' => false,
            'body' => $message->body,
            'at' => $message->created_at?->toIso8601String(),
        ], 'تم الإرسال');
    }

    /** إضافة مشارك (موظف/عضو) للمحادثة (بند 8: إضافة أعضاء). */
    public function addThreadParticipant(Request $request, ChatThread $chatThread): JsonResponse
    {
        $contact = $this->contactOrFail($request);
        $this->authorizeThread($contact, $chatThread);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'role' => ['nullable', 'string', 'max:80'],
        ]);

        $participant = $chatThread->participants()->create(['name' => $data['name'], 'role' => $data['role'] ?? null]);

        return $this->created(['id' => $participant->id, 'name' => $participant->name, 'role' => $participant->role], 'تمت إضافة العضو للمحادثة');
    }

    /** إزالة مشارك من المحادثة. */
    public function removeThreadParticipant(Request $request, ChatThread $chatThread, ChatThreadParticipant $participant): JsonResponse
    {
        $contact = $this->contactOrFail($request);
        $this->authorizeThread($contact, $chatThread);
        abort_unless($participant->chat_thread_id === $chatThread->id, 404, 'المشارك غير موجود في هذه المحادثة.');

        $participant->delete();

        return $this->ok(null, 'تمت إزالة العضو');
    }

    /** المنتدى — أسئلة العميل (مواضيعه) وردود طاقم معمار عليها. */
    public function forum(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user?->contact_id !== null, 403, 'الحساب غير مرتبط بسجل عميل.');

        $topics = ForumTopic::where('user_id', $user->id)
            ->with(['replies' => fn ($q) => $q->with('user:id,name')->oldest()])
            ->latest()
            ->limit(50)
            ->get()
            ->map(function (ForumTopic $t) use ($user): array {
                $replies = $t->replies->map(fn (ForumReply $r): array => [
                    'id' => $r->id,
                    'from_staff' => $r->user_id !== $user->id,
                    'author' => $r->user_id !== $user->id ? ($r->user?->name ?? 'فريق معمار') : $user->name,
                    'body' => $r->body,
                    'attachments' => $r->attachments ?? [],
                    'at' => $r->created_at?->toIso8601String(),
                ])->all();
                $answered = collect($replies)->contains('from_staff', true);

                return [
                    'id' => $t->id,
                    'title' => $t->title,
                    'body' => $t->body,
                    'author' => $user->name,
                    'status' => $answered ? 'answered' : 'open',
                    'status_label' => $answered ? 'تمت الإجابة' : 'سؤال',
                    'created_at' => $t->created_at?->toIso8601String(),
                    'replies' => $replies,
                ];
            })->all();

        return $this->ok($topics);
    }

    /** نشر سؤال جديد في المنتدى من العميل. */
    public function createForumThread(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user?->contact_id !== null, 403, 'الحساب غير مرتبط بسجل عميل.');

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['nullable', 'string', 'max:5000'],
        ]);

        $categoryId = ForumCategory::query()->orderBy('order')->value('id')
            ?? ForumCategory::create(['name' => 'عام', 'slug' => 'general', 'order' => 1])->id;

        $topic = ForumTopic::create([
            'category_id' => $categoryId,
            'user_id' => $user->id,
            'title' => $data['title'],
            'body' => ($data['body'] ?? '') ?: $data['title'],
        ]);

        return $this->created(['id' => $topic->id], 'تم نشر سؤالك');
    }

    /** أعضاء فريق شركة العميل. */
    public function teamMembers(Request $request): JsonResponse
    {
        $contact = $request->user()?->contact;
        abort_unless($contact !== null, 403, 'الحساب غير مرتبط بسجل عميل.');

        $members = TeamMember::where('contact_id', $contact->id)->latest()->get()
            ->map(fn (TeamMember $m): array => [
                'id' => $m->id,
                'name' => $m->name,
                'role' => $m->role,
                'projects_count' => $m->projects_count,
                'member_code' => $m->member_code,
            ])->all();

        return $this->ok($members);
    }

    /** إضافة عضو لفريق شركة العميل. */
    public function addTeamMember(Request $request): JsonResponse
    {
        $contact = $request->user()?->contact;
        abort_unless($contact !== null, 403, 'الحساب غير مرتبط بسجل عميل.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'role' => ['nullable', 'string', 'max:100'],
        ]);

        $member = TeamMember::create([
            'contact_id' => $contact->id,
            'name' => $data['name'],
            'role' => $data['role'] ?: 'مشارك',
            'member_code' => 'MEM-'.strtoupper(Str::random(6)),
        ]);

        return $this->created([
            'id' => $member->id,
            'name' => $member->name,
            'role' => $member->role,
            'member_code' => $member->member_code,
        ], 'تمت إضافة العضو');
    }

    /** إزالة عضو من فريق شركة العميل (يخصّه هو فقط). */
    public function removeTeamMember(Request $request, TeamMember $member): JsonResponse
    {
        $contact = $request->user()?->contact;
        abort_unless($contact !== null && $member->contact_id === $contact->id, 403, 'لا صلاحية لك.');

        $member->delete();

        return $this->ok(['id' => $member->id], 'تمت إزالة العضو');
    }
}
