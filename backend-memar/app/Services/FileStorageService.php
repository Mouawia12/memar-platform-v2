<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\StoredFile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * تخزين الملفات — تُحفظ على قرص خاص (غير عام) وتُنزَّل عبر نقطة محميّة.
 */
class FileStorageService
{
    /** امتدادات ممنوعة لأسباب أمنية. */
    public const BLOCKED_EXTENSIONS = ['php', 'phtml', 'phar', 'exe', 'sh', 'bat', 'cmd', 'com', 'cgi', 'pl'];

    private const DISK = 'local';

    private const DIRECTORY = 'files';

    public function list(?string $search, ?string $folder, ?int $projectId, int $perPage = 24): LengthAwarePaginator
    {
        return StoredFile::query()
            ->when($search, function ($q, string $s): void {
                $q->where(function ($inner) use ($s): void {
                    $inner->where('name', 'like', "%{$s}%")->orWhere('original_name', 'like', "%{$s}%");
                });
            })
            ->when($folder, fn ($q, string $f) => $q->where('folder', $f))
            ->when($projectId, fn ($q, int $p) => $q->where('project_id', $p))
            ->with(['project:id,name', 'uploader:id,name'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * رفع ملف وتسجيله.
     *
     * @param  array<string, mixed>  $meta
     */
    public function store(UploadedFile $file, array $meta, ?int $userId): StoredFile
    {
        $path = $file->store(self::DIRECTORY, self::DISK);

        return StoredFile::create([
            'name' => $meta['name'] ?? $file->getClientOriginalName(),
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'disk' => self::DISK,
            'mime' => $file->getClientMimeType(),
            'extension' => strtolower($file->getClientOriginalExtension()),
            'size' => $file->getSize() ?: 0,
            'folder' => $meta['folder'] ?? null,
            'project_id' => $meta['project_id'] ?? null,
            'contact_id' => $meta['contact_id'] ?? null,
            'notes' => $meta['notes'] ?? null,
            'uploaded_by' => $userId,
        ])->load(['project:id,name', 'uploader:id,name']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(StoredFile $file, array $data): StoredFile
    {
        $file->update($data);

        return $file->load(['project:id,name', 'uploader:id,name']);
    }

    /** حذف السجل والملف الفعلي معًا. */
    public function delete(StoredFile $file): void
    {
        Storage::disk($file->disk)->delete($file->path);
        $file->delete();
    }

    /** المساحة الكلية المستخدمة (بالبايت). */
    public function totalSize(): int
    {
        return (int) StoredFile::sum('size');
    }
}
