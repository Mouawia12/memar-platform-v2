<?php

declare(strict_types=1);

use App\Support\ApiResponse;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — v1
|--------------------------------------------------------------------------
| كل المسارات تحت /api/v1 وتُرجع الظرف الموحّد { success, message, data }.
| كل وحدة في ملف مستقل تحت routes/api/ للتنظيم.
*/

Route::prefix('v1')->group(function (): void {

    // فحص صحة الخدمة
    Route::get('/health', fn () => ApiResponse::success([
        'service' => 'memar-api',
        'version' => 'v1',
        'time' => now()->toIso8601String(),
    ], 'الخدمة تعمل'));

    // ── وحدات الـAPI ─────────────────────────────
    require __DIR__.'/api/auth.php';
    require __DIR__.'/api/users.php';
    require __DIR__.'/api/contacts.php';
    require __DIR__.'/api/companies.php';
    require __DIR__.'/api/projects.php';
    require __DIR__.'/api/tasks.php';
    require __DIR__.'/api/appointments.php';
    require __DIR__.'/api/invoices.php';
});
