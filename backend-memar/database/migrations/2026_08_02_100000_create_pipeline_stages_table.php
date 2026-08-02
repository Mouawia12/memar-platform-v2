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
        Schema::create('pipeline_stages', function (Blueprint $table): void {
            $table->id();
            $table->string('key', 40)->unique();
            $table->string('label', 60);
            $table->string('color', 9)->default('#6B7280');
            $table->unsignedInteger('position')->default(0);
            $table->boolean('is_won')->default(false);
            $table->boolean('is_lost')->default(false);
            // المراحل المحميّة (رابحة/خسارة) — يُعدَّل اسمها ولونها لكن لا تُحذف
            $table->boolean('is_protected')->default(false);
            $table->timestamps();
        });

        // مراحل افتراضية طبق الأصل للوحة الحالية (قابلة للتعديل والإضافة لاحقًا من الأدمن)
        $now = now();
        DB::table('pipeline_stages')->insert([
            ['key' => 'new', 'label' => 'عميل محتمل', 'color' => '#6B7280', 'position' => 1, 'is_won' => false, 'is_lost' => false, 'is_protected' => false, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'contacted', 'label' => 'تم التواصل', 'color' => '#0891B2', 'position' => 2, 'is_won' => false, 'is_lost' => false, 'is_protected' => false, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'qualified', 'label' => 'مؤهّل', 'color' => '#274A78', 'position' => 3, 'is_won' => false, 'is_lost' => false, 'is_protected' => false, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'proposal', 'label' => 'عرض سعر', 'color' => '#D97706', 'position' => 4, 'is_won' => false, 'is_lost' => false, 'is_protected' => false, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'won', 'label' => 'صفقة رابحة', 'color' => '#059669', 'position' => 90, 'is_won' => true, 'is_lost' => false, 'is_protected' => true, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'lost', 'label' => 'خسارة', 'color' => '#DC2626', 'position' => 91, 'is_won' => false, 'is_lost' => true, 'is_protected' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('pipeline_stages');
    }
};
