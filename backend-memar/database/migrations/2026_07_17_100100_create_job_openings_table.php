<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_openings', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->string('department')->nullable();
            $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'internship'])->default('full_time');
            $table->string('location')->nullable();
            $table->text('description')->nullable();
            $table->text('requirements')->nullable();
            $table->string('salary_range')->nullable();
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->unsignedInteger('applicants_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_openings');
    }
};
