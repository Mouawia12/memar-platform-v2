<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MigrationsSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_migrations_run_on_sqlite(): void
    {
        $this->assertTrue(Schema::hasTable('projects'));
        $this->assertTrue(Schema::hasTable('task_comments'));
        $this->assertTrue(Schema::hasColumn('contacts', 'temperature'));
    }
}
