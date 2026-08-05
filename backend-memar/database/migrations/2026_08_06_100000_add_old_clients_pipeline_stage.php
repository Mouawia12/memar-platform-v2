<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * مرحلة «عملاء قدامى» في الـpipeline (اجتماع 2026-08-05): عملاء تواصلوا قبل فترة
 * طويلة ولم تكتمل معهم مشاريع — للرجوع والتواصل معهم. مرحلة عادية قابلة للنقل إليها.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('pipeline_stages')->updateOrInsert(
            ['key' => 'old_clients'],
            [
                'label' => 'عملاء قدامى',
                'color' => '#7C3AED',
                'position' => 80, // قبل الرابحة/الخسارة (90/91)
                'is_won' => false,
                'is_lost' => false,
                'is_protected' => false,
                'updated_at' => now(),
                'created_at' => now(),
            ],
        );
    }

    public function down(): void
    {
        DB::table('pipeline_stages')->where('key', 'old_clients')->delete();
    }
};
