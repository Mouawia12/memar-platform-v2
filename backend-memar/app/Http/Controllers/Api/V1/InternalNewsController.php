<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\InternalNews;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * أخبار الشركة الداخلية — هيرو لوحة الموظف. القراءة لأي موظف مسجّل؛
 * الكتابة للإدارة (صفحة إدارة الأخبار لاحقًا).
 */
class InternalNewsController extends ApiController
{
    /** الأخبار المفعّلة للهيرو (مرتّبة). */
    public function index(): JsonResponse
    {
        $news = InternalNews::where('is_active', true)
            ->orderBy('sort_order')->latest('published_at')->latest('id')
            ->get()
            ->map(fn (InternalNews $n): array => $this->present($n));

        return $this->ok($news);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateNews($request);
        $data['created_by'] = $request->user()?->id;
        $data['published_at'] ??= now();

        $news = InternalNews::create($data);

        return $this->created($this->present($news), 'تم إضافة الخبر');
    }

    public function update(Request $request, InternalNews $internalNews): JsonResponse
    {
        $internalNews->update($this->validateNews($request));

        return $this->ok($this->present($internalNews), 'تم تحديث الخبر');
    }

    public function destroy(InternalNews $internalNews): JsonResponse
    {
        $internalNews->delete();

        return $this->ok(null, 'تم حذف الخبر');
    }

    /** @return array<string, mixed> */
    private function validateNews(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'body' => ['nullable', 'string'],
            'type' => ['nullable', 'in:announcement,decision,alert,update'],
            'cta_label' => ['nullable', 'string', 'max:60'],
            'cta_url' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer'],
            'published_at' => ['nullable', 'date'],
        ]);
    }

    /** @return array<string, mixed> */
    private function present(InternalNews $n): array
    {
        return [
            'id' => $n->id,
            'title' => $n->title,
            'body' => $n->body,
            'type' => $n->type,
            'cta_label' => $n->cta_label,
            'cta_url' => $n->cta_url,
            'is_active' => $n->is_active,
            'sort_order' => $n->sort_order,
            'date' => ($n->published_at ?? $n->created_at)?->toIso8601String(),
        ];
    }
}
