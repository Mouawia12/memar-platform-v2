<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Salaries\StoreSalaryRequest;
use App\Http\Requests\Salaries\UpdateSalaryRequest;
use App\Http\Resources\SalaryResource;
use App\Models\Salary;
use App\Services\PayrollService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalaryController extends ApiController
{
    public function __construct(private readonly PayrollService $payroll) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->payroll->list(
            $request->string('month')->toString() ?: null,
            $request->integer('employee_id') ?: null,
            (int) ($request->integer('per_page') ?: 20),
        );

        return $this->paginated($paginator, SalaryResource::class);
    }

    public function store(StoreSalaryRequest $request): JsonResponse
    {
        $salary = $this->payroll->create($request->validated());

        return $this->created(new SalaryResource($salary), 'تم إنشاء كشف الراتب');
    }

    public function show(Salary $salary): JsonResponse
    {
        return $this->ok(new SalaryResource($salary->load('employee')));
    }

    public function update(UpdateSalaryRequest $request, Salary $salary): JsonResponse
    {
        $salary = $this->payroll->update($salary, $request->validated());

        return $this->ok(new SalaryResource($salary), 'تم تحديث كشف الراتب');
    }

    public function pay(Salary $salary): JsonResponse
    {
        $salary = $this->payroll->markPaid($salary);

        return $this->ok(new SalaryResource($salary), 'تم اعتماد الصرف');
    }

    public function destroy(Salary $salary): JsonResponse
    {
        $this->payroll->delete($salary);

        return $this->ok(null, 'تم حذف كشف الراتب');
    }
}
