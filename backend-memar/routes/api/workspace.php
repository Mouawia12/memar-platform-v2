<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\SearchController;
use Illuminate\Support\Facades\Route;

/*
| أدوات مساحة العمل — البحث الشامل والإشعارات (محصورة بصلاحيات المستخدم)
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/search', [SearchController::class, 'index']);
    Route::get('/notifications', [NotificationController::class, 'index']);
});
