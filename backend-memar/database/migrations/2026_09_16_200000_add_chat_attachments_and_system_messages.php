<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * تطوير الشات المباشر (2026-09-16): مرفقات على الرسائل، ورسائل نظام تسجّل
 * حركات المجموعة (إضافة عضو، مغادرة، إعادة تسمية) فتُقرأ في سياق المحادثة.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversation_messages', function (Blueprint $table): void {
            $table->foreignId('file_id')->nullable()->after('body')->constrained('stored_files')->nullOnDelete();
            $table->boolean('is_system')->default(false)->after('file_id');
        });

        Schema::table('client_messages', function (Blueprint $table): void {
            $table->foreignId('file_id')->nullable()->after('body')->constrained('stored_files')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('client_messages', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('file_id');
        });

        Schema::table('conversation_messages', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('file_id');
            $table->dropColumn('is_system');
        });
    }
};
