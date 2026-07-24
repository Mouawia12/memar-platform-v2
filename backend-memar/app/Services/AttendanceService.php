<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Attendance;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

/**
 * منطق الحضور والانصراف (أونلاين).
 */
class AttendanceService
{
    private const LATE_HOUR = 9; // بعد الساعة 9 صباحاً يُعتبر متأخراً

    public function today(User $user): ?Attendance
    {
        return Attendance::where('user_id', $user->id)
            ->whereDate('date', now()->toDateString())
            ->first();
    }

    public function checkIn(User $user, ?float $lat, ?float $lng): Attendance
    {
        $record = Attendance::firstOrNew([
            'user_id' => $user->id,
            'date' => now()->toDateString(),
        ]);

        if ($record->check_in_at === null) {
            $record->check_in_at = now();
            $record->status = now()->hour >= self::LATE_HOUR ? 'late' : 'present';
            $record->lat = $lat;
            $record->lng = $lng;
            $record->method = 'web';
            $record->save();
        }

        return $record;
    }

    public function checkOut(User $user): ?Attendance
    {
        $record = $this->today($user);

        if ($record && $record->check_in_at !== null && $record->check_out_at === null) {
            $record->check_out_at = now();
            $record->work_minutes = (int) $record->check_in_at->diffInMinutes(now());
            $record->save();
        }

        return $record;
    }

    public function list(?int $userId, ?string $from, ?string $to, int $perPage = 30): LengthAwarePaginator
    {
        return $this->filtered($userId, $from, $to)
            ->with('user')
            ->orderByDesc('date')
            ->paginate($perPage);
    }

    /**
     * تسجيل يدوي من الموارد البشرية — غياب أو إجازة أو تصحيح يوم مضى.
     * يُحدّث سجل اليوم نفسه إن وُجد بدل إنشاء ازدواج.
     *
     * @param  array<string, mixed>  $data
     */
    public function record(array $data): Attendance
    {
        $record = Attendance::firstOrNew([
            'user_id' => (int) $data['user_id'],
            'date' => $data['date'],
        ]);

        $record->status = $data['status'];
        $record->check_in_at = $data['check_in_at'] ?? null;
        $record->check_out_at = $data['check_out_at'] ?? null;
        $record->notes = $data['notes'] ?? null;
        $record->method = 'manual';

        // الساعات تُحسب فقط متى اكتمل الطرفان
        $record->work_minutes = $record->check_in_at && $record->check_out_at
            ? (int) Carbon::parse($record->check_in_at)->diffInMinutes(Carbon::parse($record->check_out_at))
            : null;

        $record->save();

        return $record->load('user');
    }

    /**
     * ملخّص لكل موظف ضمن المدة: أيام كل حالة ومجموع ساعات العمل.
     *
     * @return array<int, array<string, mixed>>
     */
    public function summary(?int $userId, ?string $from, ?string $to): array
    {
        $rows = $this->filtered($userId, $from, $to)
            ->selectRaw('user_id, status, COUNT(*) as days, SUM(work_minutes) as minutes')
            ->groupBy('user_id', 'status')
            ->get();

        $names = User::whereIn('id', $rows->pluck('user_id')->unique())->pluck('name', 'id');

        $byUser = [];
        foreach ($rows as $row) {
            $id = (int) $row->user_id;
            $byUser[$id] ??= [
                'user_id' => $id,
                'name' => $names[$id] ?? '—',
                'present' => 0, 'late' => 0, 'absent' => 0, 'leave' => 0,
                'work_minutes' => 0,
            ];
            $byUser[$id][(string) $row->status] = (int) $row->days;
            $byUser[$id]['work_minutes'] += (int) $row->minutes;
        }

        // نسبة الالتزام = أيام الحضور (بما فيها المتأخر) ÷ الأيام المسجّلة، والإجازة لا تُحتسب غيابًا
        return array_values(array_map(function (array $u): array {
            $counted = $u['present'] + $u['late'] + $u['absent'];
            $u['attendance_pct'] = $counted > 0 ? (int) round((($u['present'] + $u['late']) / $counted) * 100) : null;

            return $u;
        }, $byUser));
    }

    /**
     * @return Builder<Attendance>
     */
    private function filtered(?int $userId, ?string $from, ?string $to)
    {
        return Attendance::query()
            ->when($userId, fn ($q, int $id) => $q->where('user_id', $id))
            ->when($from, fn ($q, string $d) => $q->whereDate('date', '>=', $d))
            ->when($to, fn ($q, string $d) => $q->whereDate('date', '<=', $d));
    }
}
