<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\HeroSlideController;
use App\Http\Controllers\Api\V1\SiteSettingController;
use Illuminate\Support\Facades\Route;

/*
| وحدة الموقع العام — شرائح الهيرو + إعدادات الموقع
| نقاط عامة (بدون مصادقة) للموقع + نقاط إدارة محميّة.
*/

// ── نقاط عامة للموقع الأمامي ──
Route::get('/public/hero-slides', [HeroSlideController::class, 'publicIndex']);
Route::get('/public/site-settings', [SiteSettingController::class, 'publicIndex']);

// ── إدارة شرائح الإعلانات ──
Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/hero-slides', [HeroSlideController::class, 'index'])->middleware('permission:settings.manage');
    Route::post('/hero-slides', [HeroSlideController::class, 'store'])->middleware('permission:settings.manage');
    Route::get('/hero-slides/{heroSlide}', [HeroSlideController::class, 'show'])->middleware('permission:settings.manage');
    Route::match(['put', 'patch'], '/hero-slides/{heroSlide}', [HeroSlideController::class, 'update'])->middleware('permission:settings.manage');
    Route::delete('/hero-slides/{heroSlide}', [HeroSlideController::class, 'destroy'])->middleware('permission:settings.manage');

    // ── إدارة إعدادات الموقع ──
    Route::get('/site-settings', [SiteSettingController::class, 'index'])->middleware('permission:settings.manage');
    Route::match(['put', 'patch'], '/site-settings', [SiteSettingController::class, 'update'])->middleware('permission:settings.manage');
});
