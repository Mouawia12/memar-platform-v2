<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Communication;
use App\Models\Company;
use App\Models\Contact;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

/**
 * منطق سجل التواصل مع العملاء.
 */
class CommunicationService
{
    private const RELATIONS = ['logger:id,name', 'contact:id,full_name', 'company:id,name', 'staffUser:id,name'];

    /**
     * @param  array<string, mixed>  $filters  search, channel, contact_type, contact_id, company_id, user_id, follow_up
     */
    public function list(array $filters, int $perPage = 20): LengthAwarePaginator
    {
        return Communication::query()
            ->when($filters['search'] ?? null, fn (Builder $q, string $s) => $q->where(
                // مجمَّعة حتى لا يتجاوز «أو» فلاتر القناة والنوع.
                fn (Builder $w) => $w->where('contact_name', 'like', "%{$s}%")->orWhere('subject', 'like', "%{$s}%"),
            ))
            ->when($filters['channel'] ?? null, fn (Builder $q, string $c) => $q->where('channel', $c))
            ->when($filters['contact_type'] ?? null, fn (Builder $q, string $t) => $q->where('contact_type', $t))
            ->when($filters['contact_id'] ?? null, fn (Builder $q, int $id) => $q->where('contact_id', $id))
            ->when($filters['company_id'] ?? null, fn (Builder $q, int $id) => $q->where('company_id', $id))
            ->when($filters['user_id'] ?? null, fn (Builder $q, int $id) => $q->where('user_id', $id))
            ->when(($filters['follow_up'] ?? null) === 'due', fn (Builder $q) => $q->followUpDue())
            ->when(($filters['follow_up'] ?? null) === 'pending', fn (Builder $q) => $q->whereNotNull('follow_up_at')->whereNull('follow_up_done_at'))
            ->with(self::RELATIONS)
            ->latest('happened_at')
            ->latest()
            ->paginate($perPage);
    }

    /**
     * أرقام أعلى الصفحة وعدّادات تبويبات نوع الجهة.
     *
     * @return array<string, mixed>
     */
    public function stats(?int $userId): array
    {
        $weekStart = now()->startOfWeek();

        $week = Communication::where('happened_at', '>=', $weekStart)
            ->selectRaw('direction, COUNT(*) as total')
            ->groupBy('direction')
            ->pluck('total', 'direction');

        $topChannel = Communication::where('happened_at', '>=', now()->subDays(30))
            ->selectRaw('channel, COUNT(*) as total')
            ->groupBy('channel')
            ->orderByDesc('total')
            ->first();

        return [
            'today' => Communication::where('happened_at', '>=', today())->count(),
            'week_inbound' => (int) ($week['inbound'] ?? 0),
            'week_outbound' => (int) ($week['outbound'] ?? 0),
            'follow_up_due' => Communication::followUpDue()->count(),
            'my_follow_up_due' => $userId ? Communication::followUpDue()->where('logged_by', $userId)->count() : 0,
            'top_channel' => $topChannel ? ['channel' => $topChannel->channel, 'count' => (int) $topChannel->total] : null,
            'by_type' => Communication::selectRaw('contact_type, COUNT(*) as total')
                ->groupBy('contact_type')
                ->pluck('total', 'contact_type')
                ->map(fn ($n): int => (int) $n),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Communication
    {
        $data['happened_at'] ??= now();

        return Communication::create($this->fillFromLinked($data))->load(self::RELATIONS);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Communication $communication, array $data): Communication
    {
        // تغيير موعد المتابعة يعيد فتحها.
        if (array_key_exists('follow_up_at', $data) && ! array_key_exists('follow_up_done_at', $data)) {
            $new = $data['follow_up_at'] ? Carbon::parse($data['follow_up_at']) : null;
            if ($new?->timestamp !== $communication->follow_up_at?->timestamp) {
                $data['follow_up_done_at'] = null;
            }
        }

        $communication->update($this->fillFromLinked($data, $communication));

        return $communication->load(self::RELATIONS);
    }

    public function delete(Communication $communication): void
    {
        $communication->delete();
    }

    /**
     * يُبقي ربطًا واحدًا فقط يطابق نوع الجهة، ويملأ الاسم والهاتف من الجهة المربوطة
     * إن تُركا فارغين — فالاسم يبقى محفوظًا حتى لو حُذفت الجهة لاحقًا.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function fillFromLinked(array $data, ?Communication $existing = null): array
    {
        $type = $data['contact_type'] ?? $existing?->contact_type ?? 'client';
        $keep = ['client' => 'contact_id', 'company' => 'company_id', 'staff' => 'user_id'][$type] ?? 'contact_id';

        foreach (['contact_id', 'company_id', 'user_id'] as $key) {
            if ($key !== $keep && (array_key_exists($key, $data) || array_key_exists('contact_type', $data))) {
                $data[$key] = null;
            }
        }

        $id = $data[$keep] ?? null;
        if (! $id) {
            return $data;
        }

        $linked = match ($keep) {
            'contact_id' => Contact::find($id, ['id', 'full_name as name', 'phone']),
            'company_id' => Company::find($id, ['id', 'name', 'phone']),
            'user_id' => User::find($id, ['id', 'name', 'phone']),
        };

        if (blank($data['contact_name'] ?? null)) {
            $data['contact_name'] = $linked?->name ?? $existing?->contact_name;
        }
        if (blank($data['phone'] ?? null) && ! $existing?->phone) {
            $data['phone'] = $linked?->phone;
        }

        return $data;
    }
}
