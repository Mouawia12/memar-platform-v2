<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\StoredFile;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
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

    public function list(?string $search, ?string $folder, ?int $projectId, int $perPage = 24, ?User $viewer = null): LengthAwarePaginator
    {
        return $this->visibleTo($viewer)
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
     * هل يرى هذا المستخدم ملفات المكتب كلها؟ (`documents.view.all` — للإدارة ومن يحتاجها
     * بحكم عمله: مدير المشاريع، المحاسب، الموارد البشرية، السكرتارية.)
     */
    public function seesEverything(?User $viewer): bool
    {
        return (bool) $viewer?->can('documents.view.all');
    }

    /**
     * استعلام الملفات التي يحقّ لهذا المستخدم رؤيتها: ملفات مشاريعه، أو ما رفعه هو.
     *
     * مرفوعات بوابة العميل (صكوك، كروكيات، صور شخصية) تحمل contact_id بلا project_id،
     * فتخرج من هذا النطاق تلقائيًّا ولا يراها إلا من يملك `documents.view.all`.
     *
     * @return Builder<StoredFile>
     */
    public function visibleTo(?User $viewer)
    {
        $query = StoredFile::query();

        if ($this->seesEverything($viewer)) {
            return $query;
        }

        if (! $viewer) {
            return $query->whereRaw('1 = 0'); // بلا مستخدم لا شيء يُعرض
        }

        return $query->where(fn ($q) => $q
            ->whereIn('project_id', $viewer->projectIds())
            ->orWhere('uploaded_by', $viewer->id));
    }

    /** هل يُسمح لهذا المستخدم بفتح/تنزيل هذا الملف تحديدًا؟ */
    public function canAccess(StoredFile $file, ?User $viewer): bool
    {
        if ($this->seesEverything($viewer)) {
            return true;
        }

        if (! $viewer) {
            return false;
        }

        return $file->uploaded_by === $viewer->id
            || ($file->project_id !== null && $viewer->projectIds()->contains($file->project_id));
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
            'task_id' => $meta['task_id'] ?? null,
            'service_request_id' => $meta['service_request_id'] ?? null,
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
