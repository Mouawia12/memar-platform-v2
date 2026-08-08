<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** طلبات إجازات الموظفين (اجتماع 2026-08-07، بند 12): سنوية/مرضية/بدون راتب. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 20)->default('annual'); // annual | sick | unpaid
            $table->date('from_date');
            $table->date('to_date');
            $table->unsignedSmallInteger('days')->default(1);
            $table->string('reason')->nullable();
            $table->string('status', 20)->default('pending'); // pending | approved | rejected
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
