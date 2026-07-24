<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Appointments\StoreAppointmentRequest;
use App\Http\Requests\Appointments\UpdateAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Services\AppointmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppointmentController extends ApiController
{
    public function __construct(private readonly AppointmentService $appointments) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->appointments->list(
            $request->string('search')->toString() ?: null,
            $request->string('type')->toString() ?: null,
            $request->string('status')->toString() ?: null,
            $this->perPage($request, 15),
        );

        return $this->paginated($paginator, AppointmentResource::class);
    }

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()?->id;

        $appointment = $this->appointments->create($data);

        return $this->created(new AppointmentResource($appointment), 'تم إنشاء الموعد');
    }

    public function show(Appointment $appointment): JsonResponse
    {
        return $this->ok(new AppointmentResource($appointment->load('project')));
    }

    public function update(UpdateAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        $appointment = $this->appointments->update($appointment, $request->validated());

        return $this->ok(new AppointmentResource($appointment), 'تم تحديث الموعد');
    }

    public function destroy(Appointment $appointment): JsonResponse
    {
        $this->appointments->delete($appointment);

        return $this->ok(null, 'تم حذف الموعد');
    }
}
