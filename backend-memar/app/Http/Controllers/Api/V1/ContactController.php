<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Contacts\StoreContactRequest;
use App\Http\Requests\Contacts\UpdateContactRequest;
use App\Http\Resources\ContactResource;
use App\Http\Resources\FollowUpResource;
use App\Models\Contact;
use App\Models\LeadReminder;
use App\Services\CardActivityService;
use App\Services\ContactService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends ApiController
{
    public function __construct(
        private readonly ContactService $contacts,
        private readonly CardActivityService $activity,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->contacts->list(
            $request->string('search')->toString() ?: null,
            $request->string('type')->toString() ?: null,
            $this->perPage($request, 15),
        );

        return $this->paginated($paginator, ContactResource::class);
    }

    public function store(StoreContactRequest $request): JsonResponse
    {
        $data = $request->validated();
        // المكلّف بالفرصة يختاره المستخدم؛ وإن لم يُرسل فهو المستخدم الحالي.
        $data['owner_id'] ??= $request->user()?->id;
        // المنشئ يُسجَّل تلقائيًا ولا يُقبل من الطلب.
        $data['created_by'] = $request->user()?->id;

        $contact = $this->contacts->create($data);

        return $this->created(new ContactResource($contact), 'تم إضافة العميل');
    }

    public function show(Contact $contact): JsonResponse
    {
        return $this->ok(new ContactResource($contact->load('owner', 'createdBy', 'movedBy', 'convertedProject')));
    }

    public function update(UpdateContactRequest $request, Contact $contact): JsonResponse
    {
        $contact = $this->contacts->update($contact, $request->validated());

        return $this->ok(new ContactResource($contact), 'تم تحديث العميل');
    }

    public function destroy(Contact $contact): JsonResponse
    {
        $this->contacts->delete($contact);

        return $this->ok(null, 'تم حذف العميل');
    }

    /**
     * إعادة ترتيب الفرص داخل عمود CRM (أعلى/أسفل) — طلب أيمن 2026-08-15، متاح لكل الأدوار
     * (يكفي crm.view). تستقبل قائمة المعرّفات بالترتيب الجديد فتُسند board_position = الفهرس.
     */
    public function reorder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct'],
        ]);

        $this->contacts->reorder(array_map('intval', $data['ids']));

        return $this->ok(null, 'تم تحديث الترتيب');
    }

    /**
     * إزالة الفرصة من لوحة CRM مع بقاء صاحبها في سجلّ العملاء وشركتِه في
     * سجلّ الشركات (طلب أيمن 2026-08-25).
     */
    public function removeFromCrm(Contact $contact): JsonResponse
    {
        $this->contacts->removeFromPipeline($contact);

        return $this->ok(null, 'أُزيلت الفرصة من اللوحة — وبياناتها محفوظة في السجلات');
    }

    /**
     * عدّاد خفيف للفرص العاجلة/المستحقّة — يستدعيه تنبيه الجرس في كل صفحات النظام
     * (طلب أيمن 2026-08-22) بدل جلب قائمة الفرص كاملة لمجرّد معرفة العدد.
     */
    public function urgentCount(): JsonResponse
    {
        $urgentLeads = Contact::query()->where('type', 'lead')->where('is_urgent', true)
            ->orderByDesc('updated_at')
            ->pluck('id');
        $urgent = $urgentLeads->count();

        $due = LeadReminder::query()
            ->where('done', false)
            ->where('remind_at', '<=', now())
            ->whereHas('contact', fn ($q) => $q->where('type', 'lead'))
            ->count();

        // معرّف أحدث فرصة عاجلة — ليفتحها الإشعار العائم مباشرة بدل فتح اللوحة كلّها.
        return $this->ok([
            'urgent' => $urgent,
            'due' => $due,
            'first_urgent_id' => $urgentLeads->first(),
        ]);
    }

    /**
     * كل متابعات العملاء في لوحة واحدة (طلب أيمن 2026-08-24) — تُغذّي «لوحة
     * المتابعة (كانبان)» أسفل صفحة المهام: مجدولة · اليوم · متأخرة · منجزة.
     */
    public function followUps(Request $request): JsonResponse
    {
        $me = $request->user()?->id;

        $items = $this->activity->withCardActivity(
            LeadReminder::query()->with(['contact:id,full_name,owner_id', 'contact.owner:id,name', 'creator:id,name', 'assignee:id,name', 'project:id,name,code']),
            $me,
            LeadReminder::class,
        )
            ->whereHas('contact')
            /*
             * «متابعاتي» = المكلَّف بها أنا؛ ومتابعة بلا مكلَّف تبقى لمنشئها
             * (متابعات سُجّلت قبل حقل المكلَّف). وهو نفسه صاحب البطاقة في شارات
             * التوجيه، فلا يختلف معنى «لي» بين الفلتر والتمييز.
             */
            ->when($request->boolean('mine'), fn ($q) => $q->where(
                fn ($w) => $w->where('assignee_id', $me)
                    ->orWhere(fn ($n) => $n->whereNull('assignee_id')->where('created_by', $me)),
            ))
            // الترتيب اليدوي أولًا (سحب البطاقة فوق أخرى)، ثم الموعد لما لم يُرتَّب.
            ->orderBy('board_position')
            ->orderBy('remind_at')
            ->limit(300)
            ->get()
            ->map(function (LeadReminder $r) {
                $res = new FollowUpResource($r);
                $res->lateCycles = $this->lateCycles($r);
                // المتكرّرة تُعرض بموعد دورتها الحالية فلا تسقط في «متأخرة».
                $res->occurrenceAt = $r->currentOccurrence()[0];

                return $res;
            });

        return $this->ok(FollowUpResource::collection($items));
    }

    /**
     * ترتيب متابعات عمود في لوحة المتابعة بالسحب والإفلات (طلب 2026-09-15).
     * يبدأ العدّ من 1 كي تبقى المتابعة الجديدة (0) أعلى عمودها، و toBase() كي
     * لا يُحسب الترتيب تعديلًا على المتابعة (لا يمسّ updated_at).
     */
    public function reorderFollowUps(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct'],
        ]);

        foreach (array_values($data['ids']) as $i => $id) {
            LeadReminder::whereKey((int) $id)->toBase()->update(['board_position' => $i + 1]);
        }

        return $this->ok(null, 'تم تحديث الترتيب');
    }

    // ─── تذكيرات المتابعة (اجتماع 2026-08-05) ───

    /** تذكيرات الفرصة (الأحدث أولًا). */
    public function reminders(Contact $contact): JsonResponse
    {
        return $this->ok($contact->reminders()->with('creator:id,name')->orderByDesc('remind_at')->get()
            ->map(fn (LeadReminder $r): array => $this->presentReminder($r)));
    }

    public function addReminder(Request $request, Contact $contact): JsonResponse
    {
        $data = $request->validate([
            'remind_at' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
            'repeat_every' => ['nullable', function (string $attribute, mixed $value, \Closure $fail): void {
                if (! LeadReminder::isValidRepeat(is_string($value) ? $value : null)) {
                    $fail('دورية التكرار غير صالحة — اختر عددًا ووحدة (يوم/أسبوع/شهر) ضمن الحدّ المسموح.');
                }
            }],
        ]);

        $reminder = $contact->reminders()->create([
            'remind_at' => $data['remind_at'],
            'note' => $data['note'] ?? null,
            'description' => $data['description'] ?? null,
            'repeat_every' => $data['repeat_every'] ?? null,
            'project_id' => $data['project_id'] ?? null,
            'assignee_id' => $data['assignee_id'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        return $this->created($this->presentReminder($reminder->load('creator:id,name')), 'تم ضبط التذكير');
    }

    /** إنجاز/إلغاء إنجاز التذكير (يخفي التنبيه من الكرت). */
    /**
     * تحديث تذكير: تبديل حالته (بلا حمولة) أو ضبط موعده/ملاحظته صراحةً —
     * تستعمله نافذة تفاصيل المتابعة لنقلها بين أعمدة اللوحة (طلب أيمن 2026-08-25).
     */
    public function toggleReminder(Request $request, LeadReminder $reminder): JsonResponse
    {
        $data = $request->validate([
            'done' => ['sometimes', 'boolean'],
            'remind_at' => ['sometimes', 'date'],
            'note' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'project_id' => ['sometimes', 'nullable', 'integer', 'exists:projects,id'],
            'assignee_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'repeat_every' => ['sometimes', 'nullable', function (string $attribute, mixed $value, \Closure $fail): void {
                if (! LeadReminder::isValidRepeat(is_string($value) ? $value : null)) {
                    $fail('دورية التكرار غير صالحة — اختر عددًا ووحدة (يوم/أسبوع/شهر) ضمن الحدّ المسموح.');
                }
            }],
        ]);

        // بلا حمولة = تبديل الحالة (السلوك القديم الذي تعتمده قائمة التذكيرات).
        $reminder->update($data === [] ? ['done' => ! $reminder->done] : $data);
        $reminder->refresh();

        // متابعة دوريّة أُنجزت → تُجدول تلقائيًا لدورتها التالية بدل أن تُغلق،
        // فتبقى المتابعة مستمرّة كما هي طبيعتها (طلب أيمن 2026-08-25).
        $rescheduled = false;
        if ($reminder->done && $reminder->repeat_every !== null) {
            // من اليوم لا من الموعد الفائت، كي لا تُولد متأخّرة.
            $next = LeadReminder::nextOccurrence($reminder->repeat_every, now());
            if ($next !== null) {
                /*
                 * التوقيت الذي اختاره المستخدم يُحفظ كما هو (طلب أيمن 2026-08-30):
                 * كان الموعد التالي يُثبَّت على 10:00 فتضيع ساعة المتابعة المختارة.
                 */
                $at = $reminder->remind_at;
                $reminder->update([
                    'done' => false,
                    'remind_at' => $at !== null ? $next->copy()->setTime($at->hour, $at->minute) : $next,
                ]);
                $reminder->refresh();
                $rescheduled = true;
            }
        }

        return $this->ok(
            $this->presentReminder($reminder),
            $rescheduled ? 'أُنجزت وجُدولت المتابعة التالية' : 'تم تحديث المتابعة',
        );
    }

    public function deleteReminder(LeadReminder $reminder): JsonResponse
    {
        $reminder->delete();

        return $this->ok(null, 'تم حذف التذكير');
    }

    /** @return array<string, mixed> */
    /**
     * عدد دورات المتابعة الفائتة (طلب أيمن 2026-08-25) — يظهر «↩ N» على البطاقة.
     * المتكرّرة: الدورات التي انقضى يومها دون إنجاز (يوم دورتها الحالية لم يفُت
     * بعد — طلب 2026-09-15). وبلا تكرار: مرّة واحدة ما دامت متأخّرة.
     */
    private function lateCycles(LeadReminder $r): int
    {
        if ($r->done || $r->remind_at === null) {
            return 0;
        }

        if (LeadReminder::repeatParts($r->repeat_every) !== null) {
            return $r->currentOccurrence()[1];
        }

        return $r->remind_at->isPast() ? 1 : 0;
    }

    private function presentReminder(LeadReminder $r): array
    {
        return [
            'id' => $r->id,
            'remind_at' => $r->remind_at?->toIso8601String(),
            'note' => $r->note,
            'description' => $r->description,
            'done' => $r->done,
            'due' => ! $r->done && $r->remind_at !== null && $r->remind_at->isPast(),
            'repeat_every' => $r->repeat_every,
            'project_id' => $r->project_id,
            'assignee_id' => $r->assignee_id,
            'late_cycles' => $this->lateCycles($r),
            'creator' => $r->creator?->name,
        ];
    }
}
