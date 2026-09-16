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
    Route::match(['put', 'patch'], '/conversations/{conversation}/messages/{message}', [ChatController::class, 'editMessage']);
    Route::delete('/conversations/{conversation}/messages/{message}', [ChatController::class, 'deleteMessage']);
    Route::post('/conversations/{conversation}/messages/{message}/reactions', [ChatController::class, 'toggleReaction']);
    Route::match(['put', 'patch'], '/conversations/{conversation}/prefs', [ChatController::class, 'updatePrefs']);
    Route::get('/conversations/{conversation}/messages/{message}/file', [ChatController::class, 'downloadMessageFile']);
    // إدارة المحادثة الجماعية: الاسم والأعضاء والمغادرة
    Route::match(['put', 'patch'], '/conversations/{conversation}', [ChatController::class, 'renameConversation']);
    Route::post('/conversations/{conversation}/participants', [ChatController::class, 'addParticipants']);
    Route::delete('/conversations/{conversation}/participants/{user}', [ChatController::class, 'removeParticipant']);
    Route::post('/conversations/{conversation}/leave', [ChatController::class, 'leaveConversation']);

    // محادثات العملاء (client_messages)
    Route::get('/clients', [ChatController::class, 'clientThreads']);
    Route::get('/clients/{contact}/messages', [ChatController::class, 'clientMessages']);
    Route::post('/clients/{contact}/messages', [ChatController::class, 'clientSend']);
    Route::get('/clients/{contact}/messages/{message}/file', [ChatController::class, 'downloadClientFile']);
});
