<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Employees\StoreEmployeeRequest;
use App\Http\Requests\Employees\UpdateEmployeeRequest;
use App\Http\Resources\EmployeeResource;
use App\Models\Employee;
use App\Services\EmployeeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeController extends ApiController
{
    public function __construct(private readonly EmployeeService $employees) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->employees->list(
            $request->string('search')->toString() ?: null,
            $request->string('status')->toString() ?: null,
            (int) ($request->integer('per_page') ?: 20),
        );

        return $this->paginated($paginator, EmployeeResource::class);
    }

    public function store(StoreEmployeeRequest $request): JsonResponse
    {
        $employee = $this->employees->create($request->validated());

        return $this->created(new EmployeeResource($employee), 'تم إضافة الموظف');
    }

    public function show(Employee $employee): JsonResponse
    {
        return $this->ok(new EmployeeResource($employee->load('user')));
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee): JsonResponse
    {
        $employee = $this->employees->update($employee, $request->validated());

        return $this->ok(new EmployeeResource($employee), 'تم تحديث الموظف');
    }

    public function destroy(Employee $employee): JsonResponse
    {
        $this->employees->delete($employee);

        return $this->ok(null, 'تم حذف الموظف');
    }
}
