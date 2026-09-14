<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Appointment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

/**
 * منطق إدارة المواعيد والاجتماعات.
 */
class AppointmentService
{
    /**
     * قائمة المواعيد. `$mineFor` غير فارغ → ما كُلّف به هذا الموظف وحده.
     * لا يشمل ما سجّله لغيره: المدير يُنشئ مواعيد الفريق كلّها، فلو حُسبت له
     * لظهرت «مواعيدي» وكأنها الكلّ (طلب أيمن 2026-08-31).
     */
    public function list(?string $search, ?string $type, ?string $status, int $perPage = 15, ?int $mineFor = null): LengthAwarePaginator
    {
        return Appointment::query()
            ->when($search, fn ($q, string $s) => $q->where('title', 'like', "%{$s}%"))
            ->when($type, fn ($q, string $t) => $q->where('type', $t))
            ->when($status, fn ($q, string $st) => $q->where('status', $st))
            ->when($mineFor, fn ($q, int $id) => $q->where('assignee_id', $id))
            ->with(['project', 'assignee'])
            ->orderByDesc('start_at')
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Appointment
    {
        // توليد غرفة فيديو عند التفعيل
        if (! empty($data['is_video']) && empty($data['video_room'])) {
            $data['video_room'] = 'memar-'.Str::lower(Str::random(10));
        }

        return Appointment::create($data)->load(['project', 'assignee']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Appointment $appointment, array $data): Appointment
    {
        if (! empty($data['is_video']) && empty($appointment->video_room) && empty($data['video_room'])) {
            $data['video_room'] = 'memar-'.Str::lower(Str::random(10));
        }

        $appointment->update($data);

        return $appointment->load(['project', 'assignee']);
    }

    public function delete(Appointment $appointment): void
    {
        $appointment->delete();
    }
}
