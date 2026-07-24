<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\AttendanceResource;
use App\Services\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends ApiController
{
    public function __construct(private readonly AttendanceService $attendance) {}

    /** حالة حضوري اليوم. */
    public function today(Request $request): JsonResponse
    {
        $record = $this->attendance->today($request->user());

        return $this->ok($record ? new AttendanceResource($record) : null);
    }

    public function checkIn(Request $request): JsonResponse
    {
        $record = $this->attendance->checkIn(
            $request->user(),
            $request->float('lat') ?: null,
            $request->float('lng') ?: null,
        );

        return $this->ok(new AttendanceResource($record), 'تم تسجيل الحضور');
    }

    public function checkOut(Request $request): JsonResponse
    {
        $record = $this->attendance->checkOut($request->user());

        if (! $record) {
            return $this->fail('لا يوجد تسجيل حضور اليوم', 422);
        }

        return $this->ok(new AttendanceResource($record), 'تم تسجيل الانصراف');
    }

    /** سجل الحضور (لـ HR). */
    public function index(Request $request): JsonResponse
    {
        $paginator = $this->attendance->list(
            $request->integer('user_id') ?: null,
            $request->string('from')->toString() ?: null,
            $request->string('to')->toString() ?: null,
            $this->perPage($request, 30),
        );

        return $this->paginated($paginator, AttendanceResource::class);
    }
}
