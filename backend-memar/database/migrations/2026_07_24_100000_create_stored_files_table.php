<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stored_files', function (Blueprint $table): void {
            $table->id();
            $table->string('name');                 // الاسم المعروض
            $table->string('original_name');        // اسم الملف الأصلي عند الرفع
            $table->string('path');                 // المسار داخل القرص الخاص
            $table->string('disk', 40)->default('local');
            $table->string('mime', 150)->nullable();
            $table->string('extension', 20)->nullable();
            $table->unsignedBigInteger('size')->default(0);   // بالبايت
            $table->string('folder', 120)->nullable();        // تصنيف بسيط (مخططات، عقود، صور…)
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('folder');
            $table->index('project_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stored_files');
    }
};
