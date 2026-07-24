<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_applications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('job_opening_id')->nullable()->constrained('job_openings')->nullOnDelete();
            $table->string('applicant_name');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->string('position')->nullable();      // الوظيفة المطلوبة كما كتبها المتقدّم
            $table->string('experience', 60)->nullable();
            $table->string('skills')->nullable();
            $table->text('message')->nullable();
            $table->string('cv_path')->nullable();       // مسار السيرة على قرص خاص
            $table->string('cv_original_name')->nullable();
            $table->enum('status', ['new', 'reviewing', 'interview', 'accepted', 'rejected'])->default('new');
            $table->text('notes')->nullable();           // ملاحظات الموارد البشرية
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('job_opening_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_applications');
    }
};
