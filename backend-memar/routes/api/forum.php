<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ForumController;
use Illuminate\Support\Facades\Route;

/*
| وحدة المنتدى — /api/v1/forum
| متاح لكل مستخدم مسجّل (مجتمع النقاش).
*/

// ── نقطة عامة للموقع الأمامي: أسئلة/أجوبة معتمدة يراها الزوّار على اللاندنج (بند 9) ──
Route::get('/public/forum', [ForumController::class, 'publicFeed']);

Route::middleware('auth:sanctum')->group(function (): void {
    // ── لوحة المنتدى الموحّدة (نفس تصميم بوابة العميل، جدول مشترك، لكل الأدوار) ──
    Route::get('/forum/board', [ForumController::class, 'board']);
    Route::post('/forum/board', [ForumController::class, 'storeBoardTopic']);
    Route::get('/forum/categories', [ForumController::class, 'categories']);
    Route::get('/forum/topics', [ForumController::class, 'topics']);
    Route::post('/forum/topics', [ForumController::class, 'storeTopic']);
    Route::get('/forum/topics/{topic}', [ForumController::class, 'showTopic']);
    Route::delete('/forum/topics/{topic}', [ForumController::class, 'destroyTopic']);
    Route::post('/forum/topics/{topic}/replies', [ForumController::class, 'storeReply']);
    // اعتماد موضوع للعرض العام (للطاقم) — يتطلّب صلاحية إدارة المنتدى
    Route::patch('/forum/topics/{topic}/public', [ForumController::class, 'setPublic'])->middleware('permission:forum.manage');
    Route::delete('/forum/replies/{reply}', [ForumController::class, 'destroyReply']);
});
