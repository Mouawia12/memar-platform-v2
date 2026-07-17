<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('full_name');
            $table->string('job_title')->nullable();
            $table->string('department')->nullable();
            $table->date('hire_date')->nullable();
            $table->decimal('base_salary_kwd', 12, 3)->default(0);
            $table->string('phone')->nullable();
            $table->text('national_id')->nullable(); // مُشفّر (encrypted cast)
            $table->enum('status', ['active', 'left'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
