<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\Contact;
use App\Models\OpportunityUpdate;
use App\Services\OpportunityUpdateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * تايملاين تحديثات الفرصة + تسجيل تحديث جديد (مع موعد متابعة ومنطق العاجل).
 */
class OpportunityUpdateController extends ApiController
{
    public function __construct(private readonly OpportunityUpdateService $updates) {}

    /** تايملاين الفرصة — الأحدث أولًا. */
    public function index(Contact $contact): JsonResponse
    {
        $rows = OpportunityUpdate::where('contact_id', $contact->id)
            ->with('user:id,name')->latest()->get()
            ->map(fn (OpportunityUpdate $u): array => $this->present($u));

        return $this->ok($rows);
    }

    /** تسجيل تحديث (اختصار و/أو ملاحظة) + موعد متابعة اختياري. */
    public function store(Request $request, Contact $contact): JsonResponse
    {
        $data = $request->validate([
            'action_key' => ['nullable', 'string', 'max:40', 'exists:quick_actions,key'],
            'note' => ['nullable', 'string', 'max:2000'],
            'next_followup_at' => ['nullable', 'date'],
        ]);

        if (empty($data['action_key']) && empty(trim((string) ($data['note'] ?? '')))) {
            return $this->fail('اختر اختصارًا أو اكتب ملاحظة للتحديث.', 422);
        }

        $update = $this->updates->log($contact, $data, $request->user()?->id);

        return $this->created($this->present($update), 'تم تسجيل التحديث');
    }

    /** @return array<string, mixed> */
    private function present(OpportunityUpdate $u): array
    {
        return [
            'id' => $u->id,
            'action_key' => $u->action_key,
            'note' => $u->note,
            'next_followup_at' => $u->next_followup_at?->toIso8601String(),
            'user' => $u->user?->name,
            'created_at' => $u->created_at?->toIso8601String(),
        ];
    }
}
