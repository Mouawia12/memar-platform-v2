<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Quotations\StoreQuotationRequest;
use App\Http\Requests\Quotations\UpdateQuotationRequest;
use App\Http\Resources\ContractResource;
use App\Http\Resources\QuotationResource;
use App\Models\Quotation;
use App\Services\QuotationService;
use App\Services\SalesWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuotationController extends ApiController
{
    public function __construct(private readonly QuotationService $quotations) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->quotations->list(
            $request->string('search')->toString() ?: null,
            $request->string('status')->toString() ?: null,
            (int) ($request->integer('per_page') ?: 15),
        );

        return $this->paginated($paginator, QuotationResource::class);
    }

    public function store(StoreQuotationRequest $request): JsonResponse
    {
        $quotation = $this->quotations->create($request->validated(), $request->user()?->id);

        return $this->created(new QuotationResource($quotation), 'تم إنشاء عرض السعر');
    }

    public function show(Quotation $quotation): JsonResponse
    {
        return $this->ok(new QuotationResource($quotation->load(['client', 'project', 'items'])));
    }

    public function update(UpdateQuotationRequest $request, Quotation $quotation): JsonResponse
    {
        $quotation = $this->quotations->update($quotation, $request->validated());

        return $this->ok(new QuotationResource($quotation), 'تم تحديث عرض السعر');
    }

    /** تحويل العرض إلى عقد (ويصبح العرض مقبولًا). */
    public function convertToContract(Request $request, Quotation $quotation, SalesWorkflowService $workflow): JsonResponse
    {
        try {
            $contract = $workflow->quotationToContract($quotation, $request->user()?->id);
        } catch (\RuntimeException $e) {
            return $this->fail($e->getMessage(), 422);
        }

        return $this->created(new ContractResource($contract), 'تم تحويل العرض إلى عقد');
    }

    public function destroy(Quotation $quotation): JsonResponse
    {
        $this->quotations->delete($quotation);

        return $this->ok(null, 'تم حذف عرض السعر');
    }
}
