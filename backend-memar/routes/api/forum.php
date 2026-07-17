<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ForumController;
use Illuminate\Support\Facades\Route;

/*
| وحدة المنتدى — /api/v1/forum
| متاح لكل مستخدم مسجّل (مجتمع النقاش).
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/forum/categories', [ForumController::class, 'categories']);
    Route::get('/forum/topics', [ForumController::class, 'topics']);
    Route::post('/forum/topics', [ForumController::class, 'storeTopic']);
    Route::get('/forum/topics/{topic}', [ForumController::class, 'showTopic']);
    Route::delete('/forum/topics/{topic}', [ForumController::class, 'destroyTopic']);
    Route::post('/forum/topics/{topic}/replies', [ForumController::class, 'storeReply']);
    Route::delete('/forum/replies/{reply}', [ForumController::class, 'destroyReply']);
});
