<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\SettingController;
use Illuminate\Support\Facades\Route;

/*
| إعدادات ديناميكية لفضاء (loyalty…) — إدارة فقط.
| gate بـloyalty.manage: يملكها الأدمن والمدير العام (لا إعدادات النظام العامة).
*/
Route::middleware(['auth:sanctum', 'permission:loyalty.manage'])->group(function (): void {
    Route::get('/settings/{group}', [SettingController::class, 'show']);
    Route::match(['put', 'patch'], '/settings/{group}', [SettingController::class, 'update']);
});
