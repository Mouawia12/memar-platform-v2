<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salaries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('month', 7); // YYYY-MM
            $table->decimal('base_kwd', 12, 3)->default(0);
            $table->decimal('allowances_kwd', 12, 3)->default(0);
            $table->decimal('deductions_kwd', 12, 3)->default(0);
            $table->decimal('net_kwd', 12, 3)->default(0);
            $table->enum('status', ['draft', 'paid'])->default('draft');
            $table->date('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['employee_id', 'month']);
            $table->index('month');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salaries');
    }
};
