<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Companies\StoreCompanyRequest;
use App\Http\Requests\Companies\UpdateCompanyRequest;
use App\Http\Resources\CompanyResource;
use App\Models\Company;
use App\Services\CompanyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends ApiController
{
    public function __construct(private readonly CompanyService $companies) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->companies->list(
            $request->string('search')->toString() ?: null,
            $request->string('type')->toString() ?: null,
            $this->perPage($request, 15),
        );

        return $this->paginated($paginator, CompanyResource::class);
    }

    public function store(StoreCompanyRequest $request): JsonResponse
    {
        $company = $this->companies->create($request->validated());

        return $this->created(new CompanyResource($company), 'تم إضافة الشركة');
    }

    public function show(Company $company): JsonResponse
    {
        return $this->ok(new CompanyResource($company));
    }

    public function update(UpdateCompanyRequest $request, Company $company): JsonResponse
    {
        $company = $this->companies->update($company, $request->validated());

        return $this->ok(new CompanyResource($company), 'تم تحديث الشركة');
    }

    public function destroy(Company $company): JsonResponse
    {
        $this->companies->delete($company);

        return $this->ok(null, 'تم حذف الشركة');
    }
}
