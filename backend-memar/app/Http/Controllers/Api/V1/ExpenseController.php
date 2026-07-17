<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Finance\StoreExpenseRequest;
use App\Http\Requests\Finance\UpdateExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Services\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends ApiController
{
    public function __construct(private readonly FinanceService $finance) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->finance->list(
            $request->string('search')->toString() ?: null,
            $request->string('category')->toString() ?: null,
            (int) ($request->integer('per_page') ?: 20),
        );

        return $this->paginated($paginator, ExpenseResource::class);
    }

    public function overview(): JsonResponse
    {
        return $this->ok($this->finance->overview());
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['recorded_by'] = $request->user()?->id;

        $expense = $this->finance->create($data);

        return $this->created(new ExpenseResource($expense), 'تم تسجيل المصروف');
    }

    public function show(Expense $expense): JsonResponse
    {
        return $this->ok(new ExpenseResource($expense->load('recorder:id,name')));
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): JsonResponse
    {
        $expense = $this->finance->update($expense, $request->validated());

        return $this->ok(new ExpenseResource($expense), 'تم تحديث المصروف');
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $this->finance->delete($expense);

        return $this->ok(null, 'تم حذف المصروف');
    }
}
