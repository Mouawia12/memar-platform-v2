<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ChatController;
use Illuminate\Support\Facades\Route;

/*
| الشات المباشر لطاقم معمار — /api/v1/chat
| محادثات داخلية (أدمن/موظفين) + محادثات الطاقم مع العملاء.
| الحماية داخل المتحكّم: طاقم فقط (المستخدم غير المرتبط بسجل عميل).
*/

Route::middleware('auth:sanctum')->prefix('chat')->group(function (): void {
    Route::get('/unread', [ChatController::class, 'unreadSummary']);

    // محادثات داخلية
    Route::get('/staff', [ChatController::class, 'staff']);
    Route::get('/conversations', [ChatController::class, 'conversations']);
    Route::post('/conversations', [ChatController::class, 'createConversation']);
    Route::get('/conversations/{conversation}/messages', [ChatController::class, 'messages']);
    Route::post('/conversations/{conversation}/messages', [ChatController::class, 'send']);

    // محادثات العملاء (client_messages)
    Route::get('/clients', [ChatController::class, 'clientThreads']);
    Route::get('/clients/{contact}/messages', [ChatController::class, 'clientMessages']);
    Route::post('/clients/{contact}/messages', [ChatController::class, 'clientSend']);
});
