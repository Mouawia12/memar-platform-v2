<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * حالة «لم تُنفَّذ» للمهام (اجتماع 3): بدل حذف المهمة، يمكن تعليمها كغير منفّذة.
 * الحذف يبقى للإدارة فقط. change() ليعمل على MySQL وsqlite معًا.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->enum('status', ['todo', 'in_progress', 'review', 'done', 'cancelled'])
                ->default('todo')
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->enum('status', ['todo', 'in_progress', 'review', 'done'])
                ->default('todo')
                ->change();
        });
    }
};
