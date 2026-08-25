<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Contacts\StoreContactRequest;
use App\Http\Requests\Contacts\UpdateContactRequest;
use App\Http\Resources\ContactResource;
use App\Models\Contact;
use App\Models\LeadReminder;
use App\Services\ContactService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends ApiController
{
    public function __construct(private readonly ContactService $contacts) {}

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
        $items = LeadReminder::query()
            ->with(['contact:id,full_name,owner_id', 'contact.owner:id,name', 'creator:id,name'])
            ->whereHas('contact')
            ->when($request->boolean('mine'), fn ($q) => $q->where('created_by', $request->user()?->id))
            ->orderBy('remind_at')
            ->limit(300)
            ->get()
            ->map(fn (LeadReminder $r): array => [
                'id' => $r->id,
                'contact_id' => $r->contact_id,
                'contact' => $r->contact?->full_name,
                'note' => $r->note,
                'remind_at' => $r->remind_at?->toIso8601String(),
                'done' => (bool) $r->done,
                'owner' => $r->contact?->owner ? ['id' => $r->contact->owner->id, 'name' => $r->contact->owner->name] : null,
                'creator' => $r->creator?->name,
            ]);

        return $this->ok($items);
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
        ]);

        $reminder = $contact->reminders()->create([
            'remind_at' => $data['remind_at'],
            'note' => $data['note'] ?? null,
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
        ]);

        // بلا حمولة = تبديل الحالة (السلوك القديم الذي تعتمده قائمة التذكيرات).
        $reminder->update($data === [] ? ['done' => ! $reminder->done] : $data);

        return $this->ok($this->presentReminder($reminder->refresh()), 'تم تحديث المتابعة');
    }

    public function deleteReminder(LeadReminder $reminder): JsonResponse
    {
        $reminder->delete();

        return $this->ok(null, 'تم حذف التذكير');
    }

    /** @return array<string, mixed> */
    private function presentReminder(LeadReminder $r): array
    {
        return [
            'id' => $r->id,
            'remind_at' => $r->remind_at?->toIso8601String(),
            'note' => $r->note,
            'done' => $r->done,
            'due' => ! $r->done && $r->remind_at !== null && $r->remind_at->isPast(),
            'creator' => $r->creator?->name,
        ];
    }
}
