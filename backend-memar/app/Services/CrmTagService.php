<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CrmTag;
use Illuminate\Support\Collection;

/**
 * منطق اختصارات (وسوم) الفرص — الكتالوج المعتمد + سير طلبات الاعتماد (طبق أصل V42).
 */
class CrmTagService
{
    /**
     * @return Collection<int, CrmTag>
     */
    public function list(): Collection
    {
        // ترتيب متوافق مع MySQL وSQLite (بدل FIELD): المعلّقة أولًا ثم المعتمدة ثم المرفوضة.
        return CrmTag::query()
            ->with(['requester:id,name', 'decider:id,name'])
            ->orderByRaw("CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END")
            ->orderBy('name')
            ->get();
    }

    /** أسماء الاختصارات المعتمدة فقط (الكتالوج الظاهر على السيستم). */
    public function approvedNames(): array
    {
        return CrmTag::query()->where('status', 'approved')->orderBy('name')->pluck('name')->all();
    }

    /**
     * إضافة/طلب اختصار. المدير يعتمده مباشرة؛ غير المدير يُسجَّل كطلب pending.
     */
    public function createOrRequest(string $name, ?int $userId, bool $isManager): CrmTag
    {
        $name = trim($name);

        // موجود مسبقًا: أعده كما هو (idempotent) — يمنع التكرار.
        $existing = CrmTag::query()->where('name', $name)->first();
        if ($existing) {
            return $existing;
        }

        return CrmTag::create([
            'name' => $name,
            'status' => $isManager ? 'approved' : 'pending',
            'requested_by' => $userId,
            'decided_by' => $isManager ? $userId : null,
            'decided_at' => $isManager ? now() : null,
        ]);
    }

    public function approve(CrmTag $tag, ?int $deciderId): CrmTag
    {
        $tag->update(['status' => 'approved', 'decided_by' => $deciderId, 'decided_at' => now()]);

        return $tag->load(['requester:id,name', 'decider:id,name']);
    }

    public function reject(CrmTag $tag, ?int $deciderId): CrmTag
    {
        $tag->update(['status' => 'rejected', 'decided_by' => $deciderId, 'decided_at' => now()]);

        return $tag->load(['requester:id,name', 'decider:id,name']);
    }

    public function delete(CrmTag $tag): void
    {
        $tag->delete();
    }
}
