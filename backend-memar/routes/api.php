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
    require __DIR__.'/api/services.php';
    require __DIR__.'/api/quotations.php';
    require __DIR__.'/api/documents.php';
    require __DIR__.'/api/attendance.php';
    require __DIR__.'/api/employees.php';
    require __DIR__.'/api/salaries.php';
    require __DIR__.'/api/contracts.php';
    require __DIR__.'/api/reports.php';
    require __DIR__.'/api/forum.php';
    require __DIR__.'/api/chatbot.php';
    require __DIR__.'/api/careers.php';
    require __DIR__.'/api/finance.php';
    require __DIR__.'/api/requests.php';
    require __DIR__.'/api/site.php';
    require __DIR__.'/api/communications.php';
});
