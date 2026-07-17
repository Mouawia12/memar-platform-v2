<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->string('category')->nullable();
            $table->decimal('amount_kwd', 12, 3)->default(0);
            $table->date('spent_at');
            $table->string('vendor')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('category');
            $table->index('spent_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
