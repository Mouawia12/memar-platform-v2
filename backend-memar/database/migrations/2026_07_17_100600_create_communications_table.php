<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('communications', function (Blueprint $table): void {
            $table->id();
            $table->string('contact_name');
            $table->string('phone')->nullable();
            $table->enum('channel', ['whatsapp', 'phone', 'email', 'sms', 'meeting'])->default('whatsapp');
            $table->enum('direction', ['inbound', 'outbound'])->default('outbound');
            $table->string('subject')->nullable();
            $table->text('body')->nullable();
            $table->timestamp('happened_at')->nullable();
            $table->foreignId('logged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('channel');
            $table->index('happened_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('communications');
    }
};
