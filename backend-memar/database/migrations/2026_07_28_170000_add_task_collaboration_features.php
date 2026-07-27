<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ميزات صفحة تفاصيل المهمة (طلب TASK-4): مُنشئ، مشاركون متعددون،
 * محادثة/تايم‌لاين، ملفات مرفقة، غرفة فيديو، وتقييم إداري.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->foreignId('created_by')->nullable()->after('assignee_id')->constrained('users')->nullOnDelete();
            $table->string('video_room')->nullable()->after('position');
            $table->string('rating', 20)->nullable()->after('video_room'); // positive | negative
        });

        // محادثة/تايم‌لاين المهمة
        Schema::create('task_comments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('body');
            $table->timestamps();
            $table->index('task_id');
        });

        // مشاركون متعددون (مجموعة العمل على المهمة)
        Schema::create('task_user', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['task_id', 'user_id']);
        });

        // ربط الملفات المرفوعة بالمهمة
        Schema::table('stored_files', function (Blueprint $table): void {
            $table->foreignId('task_id')->nullable()->after('project_id')->constrained('tasks')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('stored_files', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('task_id');
        });
        Schema::dropIfExists('task_user');
        Schema::dropIfExists('task_comments');
        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('created_by');
            $table->dropColumn(['video_room', 'rating']);
        });
    }
};
