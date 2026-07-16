<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Documents\StoreTemplateRequest;
use App\Http\Requests\Documents\UpdateTemplateRequest;
use App\Http\Resources\DocumentTemplateResource;
use App\Models\DocumentTemplate;
use App\Services\DocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentTemplateController extends ApiController
{
    public function __construct(private readonly DocumentService $documents) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->documents->listTemplates($request->string('search')->toString() ?: null);

        return $this->paginated($paginator, DocumentTemplateResource::class);
    }

    public function store(StoreTemplateRequest $request): JsonResponse
    {
        $template = $this->documents->createTemplate($request->validated());

        return $this->created(new DocumentTemplateResource($template), 'تم إنشاء القالب');
    }

    public function show(DocumentTemplate $documentTemplate): JsonResponse
    {
        return $this->ok(new DocumentTemplateResource($documentTemplate));
    }

    public function update(UpdateTemplateRequest $request, DocumentTemplate $documentTemplate): JsonResponse
    {
        $template = $this->documents->updateTemplate($documentTemplate, $request->validated());

        return $this->ok(new DocumentTemplateResource($template), 'تم تحديث القالب');
    }

    public function destroy(DocumentTemplate $documentTemplate): JsonResponse
    {
        $this->documents->deleteTemplate($documentTemplate);

        return $this->ok(null, 'تم حذف القالب');
    }
}
