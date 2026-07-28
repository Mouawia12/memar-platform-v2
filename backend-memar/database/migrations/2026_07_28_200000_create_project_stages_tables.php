<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * مراحل المشروع (PROJ-1/PROJ-2): كل مشروع سلسلة مراحل مرتّبة
 * (دراسات أولية → معماري → إنشائي → ترخيص → داخلي → إشراف → تسليم)،
 * لكل مرحلة حالة (منتظرة/جارية/منتهية) وسجل محادثة خاص بها.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_stages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('name');
            $table->enum('status', ['pending', 'active', 'done'])->default('pending');
            $table->unsignedInteger('position')->default(0);
            $table->unsignedInteger('expected_days')->nullable();
            $table->unsignedInteger('actual_days')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['project_id', 'position']);
        });

        Schema::create('project_stage_comments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_stage_id')->constrained('project_stages')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('body');
            $table->timestamps();

            $table->index('project_stage_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_stage_comments');
        Schema::dropIfExists('project_stages');
    }
};
