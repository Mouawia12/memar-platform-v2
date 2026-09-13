<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Files\StoreFileRequest;
use App\Http\Resources\StoredFileResource;
use App\Models\StoredFile;
use App\Services\FileStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * مدير الملفات — رفع/تصفح/تنزيل ملفات المشاريع والعملاء.
 */
class FileController extends ApiController
{
    public function __construct(private readonly FileStorageService $files) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->files->list(
            $request->string('search')->toString() ?: null,
            $request->string('folder')->toString() ?: null,
            $request->integer('project_id') ?: null,
            $this->perPage($request, 24),
            $request->user(),
        );

        return $this->paginated($paginator, StoredFileResource::class);
    }

    /**
     * إحصاءات سريعة (العدد والمساحة والمجلدات) — بنفس نطاق السجل:
     * أرقام المكتب كلّه لمن يملك documents.view.all، وإلا أرقام ما يراه هو.
     */
    public function stats(Request $request): JsonResponse
    {
        $scoped = $this->files->visibleTo($request->user());

        return $this->ok([
            'count' => (clone $scoped)->count(),
            'total_size' => (int) (clone $scoped)->sum('size'),
            'folders' => (clone $scoped)->whereNotNull('folder')->distinct()->orderBy('folder')->pluck('folder'),
        ]);
    }

    public function store(StoreFileRequest $request): JsonResponse
    {
        $file = $this->files->store(
            $request->file('file'),
            $request->safe()->except('file'),
            $request->user()?->id,
        );

        return $this->created(new StoredFileResource($file), 'تم رفع الملف');
    }

    /** تنزيل الملف من القرص الخاص — محميّ بالمصادقة وبنطاق الموظف. */
    public function download(Request $request, StoredFile $file): StreamedResponse
    {
        abort_unless($this->files->canAccess($file, $request->user()), 403, 'لا صلاحية لك على هذا الملف.');
        abort_unless(Storage::disk($file->disk)->exists($file->path), 404, 'الملف غير موجود على القرص');

        return Storage::disk($file->disk)->download($file->path, $file->original_name);
    }

    public function update(Request $request, StoredFile $file): JsonResponse
    {
        abort_unless($this->files->canAccess($file, $request->user()), 403, 'لا صلاحية لك على هذا الملف.');

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'folder' => ['nullable', 'string', 'max:120'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'notes' => ['nullable', 'string'],
        ]);

        return $this->ok(new StoredFileResource($this->files->update($file, $data)), 'تم تحديث الملف');
    }

    public function destroy(Request $request, StoredFile $file): JsonResponse
    {
        abort_unless($this->files->canAccess($file, $request->user()), 403, 'لا صلاحية لك على هذا الملف.');

        $this->files->delete($file);

        return $this->ok(null, 'تم حذف الملف');
    }
}
