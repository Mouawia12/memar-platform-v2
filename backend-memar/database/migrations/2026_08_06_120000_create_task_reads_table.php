<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * حالة قراءة إشعار المهمة لكل مستخدم — يسمح لكل مستخدم بتعليم نشاط المهمة كمقروء
 * فيختفي جرس الإشعار عنده وحده (طلب أيمن 2026-08-06).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_reads', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('read_at');
            $table->timestamps();

            $table->unique(['task_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_reads');
    }
};
