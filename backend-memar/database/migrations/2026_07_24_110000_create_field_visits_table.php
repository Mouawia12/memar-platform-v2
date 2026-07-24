<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('field_visits', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->foreignId('engineer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['inspection', 'progress', 'handover', 'survey', 'other'])->default('inspection');
            $table->enum('status', ['scheduled', 'completed', 'cancelled'])->default('scheduled');
            $table->dateTime('visit_date');
            $table->string('location')->nullable();
            $table->unsignedTinyInteger('progress_pct')->nullable();  // نسبة الإنجاز المرصودة
            $table->text('findings')->nullable();                     // الملاحظات الميدانية
            $table->text('recommendations')->nullable();              // التوصيات
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('visit_date');
            $table->index('project_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('field_visits');
    }
};
