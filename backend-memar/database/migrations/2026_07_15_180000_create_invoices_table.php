<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table): void {
            $table->id();
            $table->string('number')->nullable()->unique();
            $table->foreignId('client_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->decimal('subtotal_kwd', 12, 3)->default(0);
            $table->decimal('tax_kwd', 12, 3)->default(0);
            $table->decimal('total_kwd', 12, 3)->default(0);
            $table->decimal('paid_kwd', 12, 3)->default(0);
            $table->enum('status', ['draft', 'sent', 'partial', 'paid', 'cancelled'])->default('draft');
            $table->date('issue_date')->nullable();
            $table->date('due_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
