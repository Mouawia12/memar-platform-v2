<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('forum_categories', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('description')->nullable();
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
        });

        Schema::create('forum_topics', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('category_id')->constrained('forum_categories')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('body');
            $table->unsignedInteger('views')->default(0);
            $table->boolean('is_pinned')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index('category_id');
        });

        Schema::create('forum_replies', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('topic_id')->constrained('forum_topics')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('body');
            $table->timestamps();
            $table->softDeletes();
        });

        // أقسام افتراضية
        DB::table('forum_categories')->insert([
            ['name' => 'عام', 'slug' => 'general', 'description' => 'نقاش عام', 'order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'أسئلة تقنية', 'slug' => 'technical', 'description' => 'أسئلة وأجوبة تقنية', 'order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'اقتراحات', 'slug' => 'suggestions', 'description' => 'اقتراحات وتحسينات', 'order' => 3, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('forum_replies');
        Schema::dropIfExists('forum_topics');
        Schema::dropIfExists('forum_categories');
    }
};
