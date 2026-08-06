<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // إسناد الموظفين إلى المشاريع (many-to-many) — «مشاريعي» + مشاريع مشتركة (اجتماع بند 11-14).
        Schema::create('project_members', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role_on_project')->nullable(); // دور الموظف داخل المشروع (مهندس معماري، مشرف موقع…)
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('last_seen_at')->nullable(); // آخر مرة فتح فيها الموظف المشروع (لتمييز «الجديد»)
            $table->timestamps();

            $table->unique(['project_id', 'user_id']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_members');
    }
};
