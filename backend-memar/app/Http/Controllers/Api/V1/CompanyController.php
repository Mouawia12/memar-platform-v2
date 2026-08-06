<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Companies\StoreCompanyRequest;
use App\Http\Requests\Companies\UpdateCompanyRequest;
use App\Http\Resources\CompanyResource;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Project;
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

    /**
     * صفحة الشركة الكاملة للطاقم — بنفس تصميم صفحة الشركة في بوابة العميل،
     * مع بيانات الأعضاء والمشاريع المرتبطة (بمطابقة اسم الشركة على جهات الاتصال)
     * والتقييم الداخلي (يظهر للإدارة/الموظفين فقط، لا للعميل).
     */
    public function overview(Company $company): JsonResponse
    {
        $contacts = Contact::where('company', $company->name)->get();
        $contactIds = $contacts->pluck('id');

        $projects = Project::whereIn('client_id', $contactIds)
            ->with('manager:id,name')
            ->latest()
            ->get();

        $countFor = fn (int $contactId): int => $projects->where('client_id', $contactId)->count();
        // العضو صاحب أكبر عدد مشاريع يُوسم #1 (المالك/الأبرز).
        $topId = $projects->groupBy('client_id')->map->count()->sortDesc()->keys()->first();

        $members = $contacts
            ->sortByDesc(fn (Contact $c): int => $countFor($c->id))
            ->values()
            ->map(fn (Contact $c): array => [
                'id' => $c->id,
                'name' => $c->full_name,
                'position' => $c->position,
                'kunya' => $c->kunya,
                'account_number' => $c->account_number,
                'project_count' => $countFor($c->id),
                'is_top' => $c->id === $topId,
            ])->all();

        $active = $projects->whereIn('status', ['active', 'review'])->count();
        $done = $projects->where('status', 'done')->count();

        return $this->ok([
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'type' => $company->type,
                'industry' => $company->industry,
                'phone' => $company->phone,
                'email' => $company->email,
                'address' => $company->address,
                'since' => $company->created_at?->format('Y'),
                'internal_rating' => $company->internal_rating !== null ? (int) $company->internal_rating : null,
                'internal_notes' => $company->internal_notes,
            ],
            'stats' => [
                'members' => $contacts->count(),
                'projects' => $projects->count(),
                'active' => $active,
                'done' => $done,
            ],
            'members' => $members,
            'projects' => $projects->map(fn (Project $p): array => [
                'id' => $p->id,
                'code' => $p->code,
                'name' => $p->name,
                'status' => $p->status,
                'progress' => (int) ($p->progress ?? 0),
                'manager' => $p->manager?->name,
            ])->all(),
        ]);
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
