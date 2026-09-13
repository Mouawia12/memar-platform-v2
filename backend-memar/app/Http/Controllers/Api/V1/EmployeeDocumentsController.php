<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\StoredFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** مستندات مشاريع الموظف — خدمة ذاتية (اجتماع 2026-08-07، بند 12). */
class EmployeeDocumentsController extends ApiController
{
    /** ملفات مشاريع الموظف الحالي (عضو/مدير). */
    public function mine(Request $request): JsonResponse
    {
        $files = StoredFile::whereIn('project_id', $request->user()->projectIds())
            ->with('project:id,name')
            ->latest()->limit(100)->get()
            ->map(fn (StoredFile $f): array => [
                'id' => $f->id,
                'name' => $f->name,
                'original_name' => $f->original_name,
                'extension' => strtoupper((string) $f->extension),
                'folder' => $f->folder,
                'project' => $f->project?->name,
                'created_at' => $f->created_at?->toDateString(),
            ]);

        return $this->ok($files);
    }

    /** تنزيل ملف — مسموح فقط إن كان ضمن مشاريع الموظف. */
    public function download(Request $request, StoredFile $file): StreamedResponse
    {
        abort_unless($request->user()->projectIds()->contains($file->project_id), 403, 'غير مصرّح');
        abort_unless(Storage::disk($file->disk)->exists($file->path), 404, 'الملف غير موجود');

        return Storage::disk($file->disk)->download($file->path, $file->original_name);
    }
}
