<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\JobApplicationResource;
use App\Models\JobApplication;
use App\Models\JobOpening;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * طلبات التوظيف — استقبال عام من صفحة /jobs + إدارة من داخل المنصة.
 * السير الذاتية تُخزَّن على قرص خاص وتُنزَّل عبر نقطة محميّة بالمصادقة.
 */
class JobApplicationController extends ApiController
{
    /** امتدادات السيرة المسموح بها فقط (رفع عام ⇒ قائمة بيضاء صارمة). */
    private const CV_EXTENSIONS = ['pdf', 'doc', 'docx'];

    private const CV_DISK = 'local';

    private const CV_DIRECTORY = 'cvs';

    // ── عام (بدون مصادقة) ──────────────────────────

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'job_opening_id' => ['nullable', 'integer', 'exists:job_openings,id'],
            'applicant_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'experience' => ['nullable', 'string', 'max:60'],
            'skills' => ['nullable', 'string', 'max:255'],
            'message' => ['nullable', 'string', 'max:2000'],
            'cv' => ['nullable', 'file', 'max:5120', 'mimes:pdf,doc,docx'],
        ], [
            'cv.mimes' => 'السيرة الذاتية يجب أن تكون PDF أو Word.',
            'cv.max' => 'أقصى حجم للسيرة الذاتية 5 ميغابايت.',
        ]);

        $cvPath = null;
        $cvName = null;
        if ($request->hasFile('cv')) {
            $file = $request->file('cv');
            // تحقّق إضافي من الامتداد (حزام وحمّالة مع mimes)
            if (! in_array(strtolower($file->getClientOriginalExtension()), self::CV_EXTENSIONS, true)) {
                return $this->fail('نوع ملف السيرة الذاتية غير مسموح.', 422);
            }
            $cvPath = $file->store(self::CV_DIRECTORY, self::CV_DISK);
            $cvName = $file->getClientOriginalName();
        }

        $application = JobApplication::create($data + [
            'cv_path' => $cvPath,
            'cv_original_name' => $cvName,
            'status' => 'new',
        ]);

        // تحديث عدّاد المتقدّمين على الوظيفة
        if ($application->job_opening_id) {
            JobOpening::whereKey($application->job_opening_id)->increment('applicants_count');
        }

        return $this->created(null, 'تم إرسال طلبك بنجاح — سيراجعه فريق الموارد البشرية ويتواصل معك.');
    }

    // ── إدارة (محميّة بـ hr.view / hr.manage) ──────

    public function index(Request $request): JsonResponse
    {
        $paginator = JobApplication::query()
            ->when($request->string('search')->toString(), function ($q, string $s): void {
                $q->where(function ($inner) use ($s): void {
                    $inner->where('applicant_name', 'like', "%{$s}%")->orWhere('phone', 'like', "%{$s}%");
                });
            })
            ->when($request->string('status')->toString(), fn ($q, string $st) => $q->where('status', $st))
            ->when($request->integer('job_opening_id'), fn ($q, int $j) => $q->where('job_opening_id', $j))
            ->with('jobOpening:id,title')
            ->latest()
            ->paginate($this->perPage($request, 20));

        return $this->paginated($paginator, JobApplicationResource::class);
    }

    public function update(Request $request, JobApplication $jobApplication): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', 'required', Rule::in(['new', 'reviewing', 'interview', 'accepted', 'rejected'])],
            'notes' => ['nullable', 'string'],
        ]);

        $jobApplication->update($data);

        return $this->ok(new JobApplicationResource($jobApplication->load('jobOpening:id,title')), 'تم تحديث الطلب');
    }

    public function downloadCv(JobApplication $jobApplication): StreamedResponse
    {
        abort_unless($jobApplication->cv_path && Storage::disk(self::CV_DISK)->exists($jobApplication->cv_path), 404, 'لا توجد سيرة ذاتية مرفقة');

        return Storage::disk(self::CV_DISK)->download($jobApplication->cv_path, $jobApplication->cv_original_name ?? 'cv.pdf');
    }

    public function destroy(JobApplication $jobApplication): JsonResponse
    {
        if ($jobApplication->cv_path) {
            Storage::disk(self::CV_DISK)->delete($jobApplication->cv_path);
        }
        $jobApplication->delete();

        return $this->ok(null, 'تم حذف الطلب');
    }
}
