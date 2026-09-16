<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * الشات المباشر (2026-09-16): الردّ على رسالة بعينها مع اقتباسها، والإشارة
 * إلى زميل بـ @اسمه فيصله تنبيه في الجرس.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversation_messages', function (Blueprint $table): void {
            $table->foreignId('reply_to_id')->nullable()->after('body')->constrained('conversation_messages')->nullOnDelete();
            // معرّفات من أُشير إليهم — منها تنبيه «ذكرك زميل».
            $table->json('mentions')->nullable()->after('reply_to_id');
        });
    }

    public function down(): void
    {
        Schema::table('conversation_messages', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('reply_to_id');
            $table->dropColumn('mentions');
        });
    }
};
