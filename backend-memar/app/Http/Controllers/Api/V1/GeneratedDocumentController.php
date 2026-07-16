<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Documents\GenerateDocumentRequest;
use App\Http\Resources\GeneratedDocumentResource;
use App\Models\DocumentTemplate;
use App\Models\GeneratedDocument;
use App\Services\DocumentService;
use Illuminate\Http\JsonResponse;

class GeneratedDocumentController extends ApiController
{
    public function __construct(private readonly DocumentService $documents) {}

    public function index(): JsonResponse
    {
        return $this->paginated($this->documents->listGenerated(), GeneratedDocumentResource::class);
    }

    public function store(GenerateDocumentRequest $request): JsonResponse
    {
        $template = DocumentTemplate::findOrFail($request->integer('template_id'));

        $document = $this->documents->generate(
            $template,
            $request->integer('project_id') ?: null,
            $request->string('title')->toString(),
            $request->input('data', []),
            $request->user()?->id,
        );

        return $this->created(new GeneratedDocumentResource($document->load(['template', 'project'])), 'تم توليد المستند');
    }

    public function show(GeneratedDocument $generatedDocument): JsonResponse
    {
        return $this->ok(new GeneratedDocumentResource($generatedDocument->load(['template', 'project'])));
    }

    public function destroy(GeneratedDocument $generatedDocument): JsonResponse
    {
        $this->documents->deleteGenerated($generatedDocument);

        return $this->ok(null, 'تم حذف المستند');
    }
}
