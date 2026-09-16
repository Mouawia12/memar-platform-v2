<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Contact;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * نسخة احتياطية من لوحة الفرص واستعادتها (طلب أيمن 2026-09-16).
 *
 * الاستعادة لا تحذف شيئًا أبدًا — قاعدة بياناتنا حيّة لا تخزينًا في المتصفح:
 *  • فرصة موجودة  → تُحدَّث حقولها من الملف
 *  • فرصة محذوفة  → تُستعاد بمعرّفها فتعود بروابطها (مشاريعها وخيوطها)
 *  • فرصة مفقودة  → تُنشأ من جديد
 * وما عدا ذلك في اللوحة يبقى كما هو.
 */
class CrmBackupService
{
    public const VERSION = 1;

    /** الحقول التي تُحفظ وتُستعاد — بيانات الفرصة نفسها لا سجلّ نشاطها. */
    private const FIELDS = [
        'full_name', 'kunya', 'email', 'phone', 'company', 'position', 'type', 'client_kind', 'status', 'stage',
        'temperature', 'deal_value_kwd', 'notes', 'project_name', 'project_details', 'priority', 'is_vip', 'is_urgent',
        'price_1_kwd', 'price_2_kwd', 'price_3_kwd', 'expected_price_kwd', 'expected_points',
        'points_1', 'points_2', 'points_3', 'area_sqm', 'region', 'block_no', 'plot_no', 'project_type', 'source',
        'tags', 'address', 'internal_rating', 'internal_notes', 'archived_at', 'board_position',
    ];

    /**
     * كل فرص اللوحة (بما فيها المؤرشفة) في مصفوفة جاهزة للتنزيل.
     *
     * @return array<string, mixed>
     */
    public function export(): array
    {
        $opportunities = Contact::query()
            ->where('type', 'lead')
            ->with('owner:id,name')
            ->orderBy('id')
            ->get()
            ->map(fn (Contact $c): array => array_merge(
                ['id' => $c->id, 'created_at' => $c->created_at?->toIso8601String()],
                collect(self::FIELDS)->mapWithKeys(fn (string $f): array => [$f => $c->{$f}])->all(),
                ['owner' => $c->owner ? ['id' => $c->owner->id, 'name' => $c->owner->name] : null],
            ))
            ->all();

        return [
            'version' => self::VERSION,
            'exported_at' => now()->toIso8601String(),
            'count' => count($opportunities),
            'opportunities' => $opportunities,
        ];
    }

    /**
     * استعادة الفرص من ملف نسخة احتياطية.
     *
     * @param  list<array<string, mixed>>  $rows
     * @return array{updated: int, restored: int, created: int}
     */
    public function restore(array $rows): array
    {
        $result = ['updated' => 0, 'restored' => 0, 'created' => 0];
        // المكلّف يُستعاد فقط إن كان حسابه ما يزال موجودًا.
        $userIds = User::pluck('id')->flip();

        DB::transaction(function () use ($rows, &$result, $userIds): void {
            foreach ($rows as $row) {
                $data = collect(self::FIELDS)
                    ->filter(fn (string $f): bool => array_key_exists($f, $row))
                    ->mapWithKeys(fn (string $f): array => [$f => $row[$f]])
                    ->all();
                $data['type'] = 'lead';

                $ownerId = $row['owner']['id'] ?? null;
                $data['owner_id'] = $ownerId !== null && $userIds->has((int) $ownerId) ? (int) $ownerId : null;

                $existing = isset($row['id']) ? Contact::withTrashed()->find((int) $row['id']) : null;

                if ($existing === null) {
                    Contact::create($data);
                    $result['created']++;

                    continue;
                }

                if ($existing->trashed()) {
                    $existing->restore();
                    $result['restored']++;
                } else {
                    $result['updated']++;
                }

                $existing->forceFill($data)->save();
            }
        });

        return $result;
    }
}
