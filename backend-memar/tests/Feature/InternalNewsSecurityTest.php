<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\InternalNews;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * أخبار الشركة الداخلية (هيرو لوحة الموظف): القراءة لأي موظف، لكن الإضافة/التعديل/الحذف
 * للإدارة فقط (settings.manage) — لا يعبث بها أي مستخدم مسجّل. طلب أيمن 2026-08-12.
 */
class InternalNewsSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_any_authenticated_user_can_read_internal_news(): void
    {
        $this->actingAsUserWith([]);

        $this->getJson('/api/v1/internal-news')->assertOk();
    }

    public function test_non_admin_cannot_create_internal_news(): void
    {
        $this->actingAsUserWith([]);

        $this->postJson('/api/v1/internal-news', ['title' => 'خبر مدسوس'])->assertForbidden();
    }

    public function test_admin_can_create_internal_news(): void
    {
        $this->actingAsUserWith(['settings.manage']);

        $this->postJson('/api/v1/internal-news', ['title' => 'قرار إداري'])->assertCreated();
        $this->assertDatabaseHas('internal_news', ['title' => 'قرار إداري']);
    }

    public function test_non_admin_cannot_delete_internal_news(): void
    {
        $news = InternalNews::create(['title' => 'إعلان']);
        $this->actingAsUserWith([]);

        $this->deleteJson("/api/v1/internal-news/{$news->id}")->assertForbidden();
        $this->assertDatabaseHas('internal_news', ['id' => $news->id]);
    }
}
