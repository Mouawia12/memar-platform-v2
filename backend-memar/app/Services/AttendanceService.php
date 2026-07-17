<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Attendance;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

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
        return Attendance::query()
            ->when($userId, fn ($q, int $id) => $q->where('user_id', $id))
            ->when($from, fn ($q, string $d) => $q->whereDate('date', '>=', $d))
            ->when($to, fn ($q, string $d) => $q->whereDate('date', '<=', $d))
            ->with('user')
            ->orderByDesc('date')
            ->paginate($perPage);
    }
}
