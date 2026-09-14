<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * آخر تعليق على بطاقة المهمة — نصّه وصاحبه وتاريخه (طلب أيمن 2026-08-29).
 */
class TaskCardCommentTest extends TestCase
{
    use RefreshDatabase;

    private function makeTask(): Task
    {
        return Task::create(['title' => 'مهمة تجريبية', 'status' => 'todo', 'priority' => 'medium']);
    }

    public function test_card_has_no_comment_line_before_any_comment(): void
    {
        $this->actingAsUserWith(['tasks.view']);
        $this->makeTask();

        $this->getJson('/api/v1/tasks')
            ->assertOk()
            ->assertJsonPath('data.0.last_comment', null)
            ->assertJsonPath('data.0.comments_count', 0);
    }

    public function test_new_comment_from_someone_else_alerts_the_card(): void
    {
        $author = $this->actingAsUserWith(['tasks.view', 'tasks.manage']);
        $task = $this->makeTask();
        $this->postJson("/api/v1/tasks/{$task->id}/comments", ['body' => 'راجع الملف'])->assertOk();

        // كاتب التعليق لا يُنبَّه بتعليق نفسه
        $this->getJson('/api/v1/tasks')->assertJsonPath('data.0.unread_comments', 0);

        // مستخدم آخر يرى تنبيهًا على البطاقة
        $other = $this->actingAsUserWith(['tasks.view']);
        $this->getJson('/api/v1/tasks')->assertJsonPath('data.0.unread_comments', 1);

        // فتح نافذة التعليقات قراءةٌ → ينطفئ التنبيه عنده وحده
        $this->getJson("/api/v1/tasks/{$task->id}/comments")->assertOk();
        $this->getJson('/api/v1/tasks')->assertJsonPath('data.0.unread_comments', 0);

        // ولا يمسّ ذلك غيره: تعليق جديد من الأول يُنبّه الثاني من جديد.
        // نتقدّم ثانيةً لأن الطوابع بدقّة الثانية، وتعليقٌ في ثانية القراءة نفسها
        // لا يُحسب جديدًا — فرقٌ لا يظهر في الاستعمال الحقيقي.
        $this->travel(1)->second();
        $this->actingAs($author);
        $this->postJson("/api/v1/tasks/{$task->id}/comments", ['body' => 'تذكير'])->assertOk();
        $this->actingAs($other);
        $this->getJson('/api/v1/tasks')->assertJsonPath('data.0.unread_comments', 1);
    }

    public function test_comments_endpoint_lists_thread_oldest_first(): void
    {
        $user = $this->actingAsUserWith(['tasks.view', 'tasks.manage']);
        $task = $this->makeTask();

        $this->postJson("/api/v1/tasks/{$task->id}/comments", ['body' => 'الأول'])->assertOk();
        $this->postJson("/api/v1/tasks/{$task->id}/comments", ['body' => 'الثاني'])->assertOk();

        $thread = $this->getJson("/api/v1/tasks/{$task->id}/comments")->assertOk()->json('data');

        $this->assertCount(2, $thread);
        $this->assertSame('الأول', $thread[0]['body']); // ترتيب المحادثة: الأقدم أولًا
        $this->assertSame($user->name, $thread[1]['user']['name']);
        $this->assertNotNull($thread[1]['created_at']);
    }

    public function test_reading_comments_needs_view_only(): void
    {
        $task = $this->makeTask();
        $this->actingAsUserWith([]); // بلا صلاحيات

        $this->getJson("/api/v1/tasks/{$task->id}/comments")->assertForbidden();

        $this->actingAsUserWith(['tasks.view']); // العرض يكفي للقراءة
        $this->getJson("/api/v1/tasks/{$task->id}/comments")->assertOk();
    }

    public function test_card_shows_latest_comment_with_author_and_date(): void
    {
        $user = $this->actingAsUserWith(['tasks.view', 'tasks.manage']);
        $task = $this->makeTask();

        $this->postJson("/api/v1/tasks/{$task->id}/comments", ['body' => 'التعليق الأول'])->assertOk();
        $this->postJson("/api/v1/tasks/{$task->id}/comments", ['body' => 'التعليق الأخير'])->assertOk();

        $card = $this->getJson('/api/v1/tasks')->assertOk()->json('data.0');

        $this->assertSame('التعليق الأخير', $card['last_comment']['body']); // الأحدث لا الأول
        $this->assertSame($user->name, $card['last_comment']['user']['name']);
        $this->assertNotNull($card['last_comment']['created_at']);
        $this->assertSame(2, $card['comments_count']); // «+1» على البطاقة
    }
}
