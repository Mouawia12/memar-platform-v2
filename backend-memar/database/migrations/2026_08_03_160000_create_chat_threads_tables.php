<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * محادثات متعددة الخيوط للعميل (اجتماع 2026-08-03، بند 8):
 * محادثة الفريق + محادثة «الدعم الفني» + محادثات مخصّصة قابلة لإعادة التسمية،
 * مع مشاركين (موظفون/أعضاء) يُضافون للخيط.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_threads', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->string('title');
            $table->enum('kind', ['team', 'support', 'custom'])->default('custom');
            $table->timestamps();
            $table->index('contact_id');
        });

        Schema::create('chat_thread_participants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('chat_thread_id')->constrained('chat_threads')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->string('role')->nullable();
            $table->timestamps();
            $table->index('chat_thread_id');
        });

        Schema::table('client_messages', function (Blueprint $table): void {
            $table->foreignId('chat_thread_id')->nullable()->after('contact_id')
                ->constrained('chat_threads')->cascadeOnDelete();
            $table->index('chat_thread_id');
        });
    }

    public function down(): void
    {
        Schema::table('client_messages', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('chat_thread_id');
        });
        Schema::dropIfExists('chat_thread_participants');
        Schema::dropIfExists('chat_threads');
    }
};
