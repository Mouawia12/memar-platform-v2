<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->enum('type', ['meeting', 'appointment'])->default('appointment');
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->dateTime('start_at');
            $table->dateTime('end_at')->nullable();
            $table->string('location')->nullable();
            $table->boolean('is_video')->default(false);
            $table->string('video_room')->nullable();
            $table->enum('status', ['scheduled', 'done', 'cancelled'])->default('scheduled');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('start_at');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
