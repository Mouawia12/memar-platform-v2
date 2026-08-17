<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * كتالوج اختصارات (وسوم) الفرص + سير طلبات الاعتماد (طبق أصل V42):
 * الاختصار المضاف من الموظف يُسجَّل كطلب (pending) ولا يظهر على السيستم إلا بعد اعتماد الإدارة.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_tags', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('approved');
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_tags');
    }
};
