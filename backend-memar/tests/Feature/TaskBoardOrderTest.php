<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ترتيب بطاقات اللوحة: الأحدث فوق والأقدم تحت (طلب أيمن 2026-08-29).
 */
class TaskBoardOrderTest extends TestCase
{
    use RefreshDatabase;

    private function makeTask(string $title): Task
    {
        return Task::create(['title' => $title, 'status' => 'todo', 'priority' => 'medium']);
    }

    public function test_newest_task_comes_first(): void
    {
        $this->actingAsUserWith(['tasks.view']);

        $this->makeTask('الأقدم');
        $this->travel(1)->minute();
        $this->makeTask('الأحدث');

        $titles = array_column($this->getJson('/api/v1/tasks')->assertOk()->json('data'), 'title');
        $this->assertSame(['الأحدث', 'الأقدم'], $titles);
    }

    public function test_tasks_created_in_the_same_second_keep_a_stable_newest_first_order(): void
    {
        $this->actingAsUserWith(['tasks.view']);

        // الطوابع بدقّة الثانية، فالمهام المتزامنة كان ترتيبها متروكًا للقاعدة
        $this->makeTask('الأولى');
        $this->makeTask('الثانية');
        $this->makeTask('الثالثة');

        $titles = array_column($this->getJson('/api/v1/tasks')->json('data'), 'title');
        $this->assertSame(['الثالثة', 'الثانية', 'الأولى'], $titles);
    }
}
