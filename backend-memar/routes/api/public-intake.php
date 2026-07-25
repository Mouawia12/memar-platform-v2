<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\PublicIntakeController;
use Illuminate\Support\Facades\Route;

/*
| استقبال طلبات الموقع العام — بدون مصادقة، محدودة المعدّل لمنع السبام.
*/

Route::middleware('throttle:10,1')->prefix('public')->group(function (): void {
    Route::post('/leads', [PublicIntakeController::class, 'lead']);
    Route::post('/meeting-requests', [PublicIntakeController::class, 'meeting']);
    Route::post('/messages', [PublicIntakeController::class, 'message']);
    Route::post('/booking', [PublicIntakeController::class, 'book']);
});

// عرض المواعيد المتاحة — قراءة فقط، بحدّ معدّل أعلى ليتصفّح الزائر الأسابيع بحرية
Route::middleware('throttle:60,1')->prefix('public')->group(function (): void {
    Route::get('/booking/slots', [PublicIntakeController::class, 'bookingSlots']);
});
