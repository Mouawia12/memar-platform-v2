<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Contracts\StoreContractRequest;
use App\Http\Requests\Contracts\UpdateContractRequest;
use App\Http\Resources\ContractResource;
use App\Http\Resources\InvoiceResource;
use App\Models\Contract;
use App\Services\ContractService;
use App\Services\SalesWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContractController extends ApiController
{
    public function __construct(private readonly ContractService $contracts) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->contracts->list(
            $request->string('search')->toString() ?: null,
            $request->string('status')->toString() ?: null,
            $this->perPage($request, 15),
        );

        return $this->paginated($paginator, ContractResource::class);
    }

    public function store(StoreContractRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()?->id;

        $contract = $this->contracts->create($data);

        return $this->created(new ContractResource($contract), 'تم إنشاء العقد');
    }

    public function show(Contract $contract): JsonResponse
    {
        return $this->ok(new ContractResource($contract->load(['project', 'client', 'quotation'])));
    }

    public function update(UpdateContractRequest $request, Contract $contract): JsonResponse
    {
        $contract = $this->contracts->update($contract, $request->validated());

        return $this->ok(new ContractResource($contract), 'تم تحديث العقد');
    }

    /** توليد فواتير جدول الدفعات (40/30/30) للعقد. */
    public function generateInvoices(Contract $contract, SalesWorkflowService $workflow): JsonResponse
    {
        try {
            $invoices = $workflow->contractToInvoices($contract);
        } catch (\RuntimeException $e) {
            return $this->fail($e->getMessage(), 422);
        }

        return $this->created(InvoiceResource::collection(collect($invoices)), 'تم توليد '.count($invoices).' فواتير لجدول الدفعات');
    }

    public function destroy(Contract $contract): JsonResponse
    {
        $this->contracts->delete($contract);

        return $this->ok(null, 'تم حذف العقد');
    }
}
