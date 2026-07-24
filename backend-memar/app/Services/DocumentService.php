<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\DocumentTemplate;
use App\Models\GeneratedDocument;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * منطق أتمتة المستندات — القوالب والتوليد.
 */
class DocumentService
{
    // ── القوالب ──────────────────────────────────────────────
    public function listTemplates(?string $search): LengthAwarePaginator
    {
        return DocumentTemplate::query()
            ->when($search, fn ($q, string $s) => $q->where('name', 'like', "%{$s}%"))
            ->latest()
            ->paginate(20);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createTemplate(array $data): DocumentTemplate
    {
        return DocumentTemplate::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateTemplate(DocumentTemplate $template, array $data): DocumentTemplate
    {
        $template->update($data);

        return $template;
    }

    public function deleteTemplate(DocumentTemplate $template): void
    {
        $template->delete();
    }

    // ── التوليد ──────────────────────────────────────────────
    public function listGenerated(): LengthAwarePaginator
    {
        return GeneratedDocument::query()
            ->with(['template', 'project'])
            ->latest()
            ->paginate(20);
    }

    /**
     * توليد مستند بتعبئة قالب من البيانات ({{key}} → value).
     *
     * @param  array<string, mixed>  $data
     */
    public function generate(DocumentTemplate $template, ?int $projectId, string $title, array $data, ?int $userId): GeneratedDocument
    {
        $body = $template->body_html;
        foreach ($data as $key => $value) {
            $body = str_replace('{{'.$key.'}}', (string) $value, $body);
        }

        return GeneratedDocument::create([
            'template_id' => $template->id,
            'project_id' => $projectId,
            'title' => $title,
            'body_html' => $body,
            'data' => $data,
            'created_by' => $userId,
        ]);
    }

    /**
     * تحديث مستند مولّد بعد تحريره يدويًا.
     *
     * @param  array<string, mixed>  $data
     */
    public function updateGenerated(GeneratedDocument $document, array $data): GeneratedDocument
    {
        $document->update($data);

        return $document->load(['template', 'project']);
    }

    public function deleteGenerated(GeneratedDocument $document): void
    {
        $document->delete();
    }
}
