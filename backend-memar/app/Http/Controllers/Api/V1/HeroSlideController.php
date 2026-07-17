<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Site\StoreHeroSlideRequest;
use App\Http\Requests\Site\UpdateHeroSlideRequest;
use App\Http\Resources\HeroSlideResource;
use App\Models\HeroSlide;
use Illuminate\Http\JsonResponse;

class HeroSlideController extends ApiController
{
    /** كل الشرائح للإدارة. */
    public function index(): JsonResponse
    {
        $slides = HeroSlide::orderBy('sort_order')->orderBy('id')->get();

        return $this->ok(HeroSlideResource::collection($slides));
    }

    /** الشرائح المفعّلة فقط — نقطة عامة للموقع (بدون مصادقة). */
    public function publicIndex(): JsonResponse
    {
        $slides = HeroSlide::where('is_active', true)
            ->orderBy('sort_order')->orderBy('id')->get();

        return $this->ok(HeroSlideResource::collection($slides));
    }

    public function store(StoreHeroSlideRequest $request): JsonResponse
    {
        $slide = HeroSlide::create($request->validated());

        return $this->created(new HeroSlideResource($slide), 'تم إضافة الشريحة');
    }

    public function show(HeroSlide $heroSlide): JsonResponse
    {
        return $this->ok(new HeroSlideResource($heroSlide));
    }

    public function update(UpdateHeroSlideRequest $request, HeroSlide $heroSlide): JsonResponse
    {
        $heroSlide->update($request->validated());

        return $this->ok(new HeroSlideResource($heroSlide), 'تم تحديث الشريحة');
    }

    public function destroy(HeroSlide $heroSlide): JsonResponse
    {
        $heroSlide->delete();

        return $this->ok(null, 'تم حذف الشريحة');
    }
}
