<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\Service;
use App\Models\ServicePackage;
use App\Services\PricingEngineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * محرّك التسعير (طلب أيمن 2026-09-14): أربعة أنواع خلف مدخلٍ واحد —
 * حاسبة هندسية، باقات، تسعير بالتكلفة، وتقدير مستند إلى مشاريع المكتب.
 */
class PricingEngineController extends ApiController
{
    public function __construct(private readonly PricingEngineService $engine) {}

    /** خيارات الحاسبة: أنواع المباني ومستويات التصميم والخدمات المتاحة. */
    public function options(): JsonResponse
    {
        return $this->ok([
            'building_types' => array_keys(PricingEngineService::BUILDING_TYPES),
            'design_levels' => collect(PricingEngineService::DESIGN_LEVELS)
                ->map(fn (array $l, string $k): array => ['key' => $k, 'label' => $l['label'], 'factor' => $l['factor']])
                ->values()->all(),
            'services' => Service::where('is_active', true)->orderBy('category')->get()
                ->map(fn (Service $s): array => [
                    'id' => $s->id, 'name' => $s->name, 'category' => $s->category,
                    'unit' => $s->unit, 'price_kwd' => (float) $s->price_kwd,
                ])->all(),
        ]);
    }

    public function calculate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'building_type' => ['nullable', 'string', Rule::in(array_keys(PricingEngineService::BUILDING_TYPES))],
            'area_sqm' => ['required', 'numeric', 'min:1', 'max:1000000'],
            'floors' => ['nullable', 'integer', 'min:1', 'max:60'],
            'design_level' => ['nullable', Rule::in(array_keys(PricingEngineService::DESIGN_LEVELS))],
            'service_ids' => ['nullable', 'array'],
            'service_ids.*' => ['integer', 'exists:services,id'],
        ]);

        return $this->ok($this->engine->calculate($data));
    }

    public function costBased(Request $request): JsonResponse
    {
        $data = $request->validate([
            'staff' => ['nullable', 'array', 'max:30'],
            'staff.*.role' => ['required', 'string', 'max:120'],
            'staff.*.hours' => ['required', 'numeric', 'min:0', 'max:100000'],
            'staff.*.rate_kwd' => ['required', 'numeric', 'min:0', 'max:10000'],
            'other_costs' => ['nullable', 'array', 'max:30'],
            'other_costs.*.label' => ['required', 'string', 'max:120'],
            'other_costs.*.amount_kwd' => ['required', 'numeric', 'min:0', 'max:1000000'],
            'margin_percent' => ['nullable', 'numeric', 'min:0', 'max:500'],
        ]);

        return $this->ok($this->engine->costBased($data));
    }

    public function aiEstimate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'description' => ['nullable', 'string', 'max:2000'],
            'building_type' => ['nullable', 'string', 'max:60'],
            'area_sqm' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
        ]);

        return $this->ok($this->engine->aiEstimate($data));
    }

    public function packages(): JsonResponse
    {
        return $this->ok($this->packagePayload());
    }

    public function storePackage(Request $request): JsonResponse
    {
        $data = $this->validatePackage($request);
        DB::transaction(function () use ($data): void {
            $package = ServicePackage::create([
                'name' => $data['name'],
                'icon' => $data['icon'] ?? '📦',
                'description' => $data['description'] ?? null,
                'price_kwd' => $data['price_kwd'],
                'reference_area_sqm' => $data['reference_area_sqm'] ?? 800,
                'is_featured' => $data['is_featured'] ?? false,
                'position' => (int) (ServicePackage::max('position') ?? -1) + 1,
            ]);
            $this->syncServices($package, $data['service_ids'] ?? []);
        });

        return $this->created($this->packagePayload(), 'تم إنشاء الباقة');
    }

    public function updatePackage(Request $request, ServicePackage $servicePackage): JsonResponse
    {
        $data = $this->validatePackage($request);
        DB::transaction(function () use ($data, $servicePackage): void {
            $servicePackage->update([
                'name' => $data['name'],
                'icon' => $data['icon'] ?? $servicePackage->icon,
                'description' => $data['description'] ?? null,
                'price_kwd' => $data['price_kwd'],
                'reference_area_sqm' => $data['reference_area_sqm'] ?? $servicePackage->reference_area_sqm,
                'is_featured' => $data['is_featured'] ?? false,
            ]);
            $this->syncServices($servicePackage, $data['service_ids'] ?? []);
        });

        return $this->ok($this->packagePayload(), 'تم حفظ الباقة');
    }

    public function destroyPackage(ServicePackage $servicePackage): JsonResponse
    {
        $servicePackage->delete();

        return $this->ok($this->packagePayload(), 'حُذفت الباقة — وأسعار الخدمات لم تُمسّ');
    }

    /** @return array<string, mixed> */
    private function validatePackage(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'icon' => ['nullable', 'string', 'max:8'],
            'description' => ['nullable', 'string', 'max:255'],
            'price_kwd' => ['required', 'numeric', 'min:0', 'max:10000000'],
            'reference_area_sqm' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            'is_featured' => ['nullable', 'boolean'],
            'service_ids' => ['required', 'array', 'min:1'],
            'service_ids.*' => ['integer', 'exists:services,id'],
        ]);
    }

    /** @param  array<int>  $ids */
    private function syncServices(ServicePackage $package, array $ids): void
    {
        $package->services()->sync(
            collect(array_values($ids))->mapWithKeys(fn (int $id, int $i): array => [$id => ['position' => $i]])->all(),
        );
    }

    /** الباقات مع خدماتها وتوفيرها المحسوب. */
    private function packagePayload(): array
    {
        return collect($this->engine->packages())->map(fn (ServicePackage $p): array => [
            'id' => $p->id,
            'name' => $p->name,
            'icon' => $p->icon,
            'description' => $p->description,
            'price_kwd' => (float) $p->price_kwd,
            'reference_area_sqm' => (int) $p->reference_area_sqm,
            'is_featured' => $p->is_featured,
            'items_total_kwd' => $p->itemsTotalKwd(),
            'savings_kwd' => $p->savingsKwd(),
            'services' => $p->services->map(fn (Service $s): array => [
                'id' => $s->id, 'name' => $s->name, 'price_kwd' => (float) $s->price_kwd, 'unit' => $s->unit,
            ])->all(),
        ])->all();
    }
}
