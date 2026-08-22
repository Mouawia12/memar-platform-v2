<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\SettingController;
use Illuminate\Support\Facades\Route;

/*
| إعدادات ديناميكية لفضاء (loyalty…) — إدارة فقط.
| gate بـloyalty.manage: يملكها الأدمن والمدير العام (لا إعدادات النظام العامة).
*/
// قراءة إعدادات CRM متاحة لكل من يرى الفرص (تفعيل النقاط/خصوصية الأرقام) — الكتابة للإدارة.
Route::middleware(['auth:sanctum', 'permission:crm.view'])->group(function (): void {
    Route::get('/crm/settings', [SettingController::class, 'crm']);
});

Route::middleware(['auth:sanctum', 'permission:loyalty.manage'])->group(function (): void {
    Route::get('/settings/{group}', [SettingController::class, 'show']);
    Route::match(['put', 'patch'], '/settings/{group}', [SettingController::class, 'update']);
});
