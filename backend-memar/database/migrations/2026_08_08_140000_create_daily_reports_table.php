<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** التقارير اليومية للموظفين (اجتماع 2026-08-07، بند 12). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_reports', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->date('report_date');
            $table->text('accomplished');
            $table->text('challenges')->nullable();
            $table->text('tomorrow_plan')->nullable();
            $table->string('status', 20)->default('submitted'); // submitted | accepted
            $table->timestamps();
            $table->index(['user_id', 'report_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_reports');
    }
};
