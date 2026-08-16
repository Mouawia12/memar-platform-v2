<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Contact;
use App\Models\OpportunityUpdate;
use App\Models\QuickAction;
use Illuminate\Support\Facades\DB;

/**
 * تسجيل تحديثات الفرصة (التايملاين) مع آثارها الجانبية:
 *  - ضبط موعد المتابعة القادم (تذكير).
 *  - منطق «العاجل يبقى حتى تحديث فعلي»: تحديثٌ حقيقي يُزيل حالة عاجل — إمّا لأن الاختصار
 *    المستخدَم مُعلَّم clears_urgent، أو لأنه ملاحظة حرّة (تحديث فعلي من الموظف).
 */
class OpportunityUpdateService
{
    /**
     * @param  array{action_key?:?string, note?:?string, next_followup_at?:?string}  $data
     */
    public function log(Contact $contact, array $data, ?int $userId): OpportunityUpdate
    {
        return DB::transaction(function () use ($contact, $data, $userId): OpportunityUpdate {
            $actionKey = $data['action_key'] ?? null;
            $note = isset($data['note']) ? trim((string) $data['note']) : null;
            $note = $note === '' ? null : $note;
            $followup = $data['next_followup_at'] ?? null;

            $update = OpportunityUpdate::create([
                'contact_id' => $contact->id,
                'user_id' => $userId,
                'action_key' => $actionKey,
                'note' => $note,
                'next_followup_at' => $followup,
            ]);

            // موعد المتابعة القادم → تذكير على الفرصة.
            if ($followup !== null) {
                $contact->reminders()->create([
                    'remind_at' => $followup,
                    'note' => $note ?? $this->actionLabel($actionKey),
                    'created_by' => $userId,
                ]);
            }

            // إزالة «عاجل» عند تحديث فعلي (حسب إعداد الاختصار، أو أي ملاحظة حرّة).
            if ($contact->is_urgent && $this->clearsUrgent($actionKey, $note)) {
                $contact->forceFill(['is_urgent' => false])->saveQuietly();
            }

            return $update->load('user:id,name');
        });
    }

    private function clearsUrgent(?string $actionKey, ?string $note): bool
    {
        if ($actionKey !== null) {
            return (bool) QuickAction::where('key', $actionKey)->value('clears_urgent');
        }

        // ملاحظة حرّة بلا اختصار = تحديث فعلي من الموظف → يُزيل العاجل.
        return $note !== null;
    }

    private function actionLabel(?string $actionKey): ?string
    {
        return $actionKey !== null ? QuickAction::where('key', $actionKey)->value('label') : null;
    }
}
