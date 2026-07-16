<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Invoices\StoreInvoiceRequest;
use App\Http\Requests\Invoices\StorePaymentRequest;
use App\Http\Requests\Invoices\UpdateInvoiceRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends ApiController
{
    public function __construct(private readonly InvoiceService $invoices) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->invoices->list(
            $request->string('search')->toString() ?: null,
            $request->string('status')->toString() ?: null,
            (int) ($request->integer('per_page') ?: 15),
        );

        return $this->paginated($paginator, InvoiceResource::class);
    }

    public function store(StoreInvoiceRequest $request): JsonResponse
    {
        $invoice = $this->invoices->create($request->validated());

        return $this->created(new InvoiceResource($invoice), 'تم إنشاء الفاتورة');
    }

    public function show(Invoice $invoice): JsonResponse
    {
        return $this->ok(new InvoiceResource($invoice->load(['client', 'project', 'payments'])));
    }

    public function update(UpdateInvoiceRequest $request, Invoice $invoice): JsonResponse
    {
        $invoice = $this->invoices->update($invoice, $request->validated());

        return $this->ok(new InvoiceResource($invoice), 'تم تحديث الفاتورة');
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        $this->invoices->delete($invoice);

        return $this->ok(null, 'تم حذف الفاتورة');
    }

    /** تسجيل دفعة/تحصيل على الفاتورة. */
    public function storePayment(StorePaymentRequest $request, Invoice $invoice): JsonResponse
    {
        $invoice = $this->invoices->recordPayment($invoice, $request->validated(), $request->user()?->id);

        return $this->ok(new InvoiceResource($invoice), 'تم تسجيل الدفعة');
    }
}
