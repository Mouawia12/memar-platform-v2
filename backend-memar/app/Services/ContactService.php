<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Contact;
use App\Models\LoyaltyTransaction;
use App\Models\PipelineStage;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * منطق إدارة جهات الاتصال / العملاء (CRM).
 */
class ContactService
{
    public function __construct(
        private readonly ProjectService $projects,
        private readonly LoyaltyService $loyalty,
        private readonly LoyaltyRuleService $rules,
    ) {}

    public function list(?string $search, ?string $type, int $perPage = 15): LengthAwarePaginator
    {
        return Contact::query()
            ->when($search, function ($query, string $s): void {
                $query->where(function ($q) use ($s): void {
                    $q->where('full_name', 'like', "%{$s}%")
                        ->orWhere('email', 'like', "%{$s}%")
                        ->orWhere('phone', 'like', "%{$s}%")
                        ->orWhere('company', 'like', "%{$s}%");
                });
            })
            ->when($type, fn ($query, string $t) => $query->where('type', $t))
            ->with(['owner', 'convertedProject', 'reminders' => fn ($q) => $q->where('done', false)->orderBy('remind_at')])
            // الترتيب اليدوي داخل العمود أولًا (board_position)، ثم الأحدث للبقية (الافتراضي 0).
            ->orderBy('board_position')
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Contact
    {
        $data = $this->withExpectedPoints($data);
        $contact = Contact::create($data);
        $this->maybeConvertToProject($contact);

        return $contact->load('owner', 'convertedProject');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Contact $contact, array $data): Contact
    {
        $data = $this->withExpectedPoints($data, $contact);
        $contact->update($data);
        $this->maybeConvertToProject($contact);

        return $contact->load('owner', 'convertedProject');
    }

    /**
     * يحسب النقاط المتوقّعة من قواعد النقاط بناءً على السعر المتوقّع ونوع المشروع، ويحقنها
     * في البيانات (لا يقبلها من المستخدم منعًا للتلاعب). يُعاد الحساب عند تغيّر السعر/النوع.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function withExpectedPoints(array $data, ?Contact $existing = null): array
    {
        $touchesPricing = array_key_exists('expected_price_kwd', $data) || array_key_exists('project_type', $data);
        if (! $touchesPricing) {
            return $data;
        }

        $price = array_key_exists('expected_price_kwd', $data)
            ? $data['expected_price_kwd']
            : $existing?->expected_price_kwd;
        $type = array_key_exists('project_type', $data)
            ? $data['project_type']
            : $existing?->project_type;

        $data['expected_points'] = $price !== null && $price !== ''
            ? $this->rules->pointsFor((float) $price, $type !== '' ? $type : null)
            : 0;

        return $data;
    }

    public function delete(Contact $contact): void
    {
        $contact->delete();
    }

    /**
     * إعادة ترتيب الفرص: تُسند board_position = الفهرس لكل معرّف بالترتيب المُرسَل.
     * تحديث مُجمّع بدفعة واحدة (CASE) لتفادي استعلام لكل صف.
     *
     * @param  array<int, int>  $ids
     */
    public function reorder(array $ids): void
    {
        foreach (array_values($ids) as $position => $id) {
            Contact::whereKey($id)->update(['board_position' => $position]);
        }
    }

    /**
     * يحوّل الفرصة لمشروع في سجل المشاريع عند وصولها لمرحلة «صفقة رابحة» — مرّة واحدة فقط.
     */
    private function maybeConvertToProject(Contact $contact): void
    {
        if ($contact->converted_project_id !== null) {
            return; // سبق تحويلها — لا تكرار
        }

        $isWonStage = PipelineStage::where('key', $contact->stage)->value('is_won');
        if (! $isWonStage) {
            return;
        }

        // القيمة المتفَق عليها (تسبق الخصم) — وإلا السعر المتوقّع.
        $value = (float) ($contact->deal_value_kwd ?: $contact->expected_price_kwd);

        // خصم الترحيب لأول مشروع لعميلٍ مُحال (المرحلة 5) — مرّة واحدة لكل عميل.
        // يُتتبَّع على «هويّة العميل»: الأصل إن كانت فرصة لعميل موجود، وإلا الفرصة نفسها —
        // فلا يتكرّر الخصم عبر فرص متعددة لنفس العميل.
        $customer = $contact->parent_contact_id !== null
            ? (Contact::find($contact->parent_contact_id) ?? $contact)
            : $contact;
        $wasReferred = $customer->referred_by_user_id !== null || $customer->referred_by_contact_id !== null;
        $discountPct = ($wasReferred && ! $customer->welcome_discount_used && $value > 0)
            ? (int) config('loyalty.welcome_discount_pct', 10)
            : 0;
        $discountKwd = round($value * $discountPct / 100, 3);
        $finalValue = round($value - $discountKwd, 3);

        $description = $contact->project_details;
        if ($discountPct > 0) {
            $description = trim(($description ? $description."\n" : '')."خصم ترحيبي {$discountPct}٪ (عميل مُحال): -".number_format($discountKwd, 3).' د.ك');
        }

        $project = $this->projects->create([
            'name' => $contact->project_name ?: ($contact->company
                ? "مشروع {$contact->company}"
                : "مشروع {$contact->full_name}"),
            'client_id' => $contact->id,
            'manager_id' => $contact->owner_id,
            'status' => 'active',
            'budget_kwd' => $finalValue > 0 ? $finalValue : $contact->deal_value_kwd,
            'description' => $description,
        ]);

        $contact->forceFill(['converted_project_id' => $project->id])->saveQuietly();
        if ($discountPct > 0) {
            // نعلّم هويّة العميل (الأصل أو الفرصة نفسها) كي لا يتكرّر الخصم لاحقًا.
            $customer->forceFill(['welcome_discount_used' => true, 'welcome_discount_kwd' => $discountKwd])->saveQuietly();
        }

        // نقاط الموظف عند التعاقد (المرحلة 5): تُحسب من السعر النهائي عبر محرّك القواعد،
        // وتُمنح بحالة «مستحقة» (تنتظر اعتماد الإدارة قبل أن تصبح متاحة للتحويل).
        if ($contact->owner_id !== null) {
            $owner = User::find($contact->owner_id);
            $points = $this->rules->pointsFor($finalValue, $contact->project_type);
            if ($owner !== null && $points > 0) {
                $this->loyalty->awardUser(
                    $owner,
                    $points,
                    'referral_contracted',
                    $project,
                    "نقاط تعاقد الفرصة «{$contact->full_name}» ({$points}) — بانتظار اعتماد الإدارة",
                    LoyaltyTransaction::STATUS_EARNED,
                );
            }
        }
    }
}
