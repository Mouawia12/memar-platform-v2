<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\ActivityResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

/**
 * سجل التدقيق — من فعل ماذا ومتى (مبني على spatie/laravel-activitylog).
 */
class ActivityController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $paginator = Activity::query()
            ->with('causer')
            ->when($request->string('event')->toString(), fn ($q, string $e) => $q->where('event', $e))
            ->when($request->string('subject_type')->toString(), fn ($q, string $s) => $q->where('subject_type', 'App\\Models\\'.$s))
            ->when($request->integer('causer_id'), fn ($q, int $c) => $q->where('causer_id', $c))
            ->when($request->string('from')->toString(), fn ($q, string $d) => $q->whereDate('created_at', '>=', $d))
            ->when($request->string('to')->toString(), fn ($q, string $d) => $q->whereDate('created_at', '<=', $d))
            ->latest()
            ->paginate($this->perPage($request, 25));

        return $this->paginated($paginator, ActivityResource::class);
    }

    /** خيارات الفلاتر (أنواع الكيانات، الأحداث، المستخدمون). */
    public function filters(): JsonResponse
    {
        $subjects = Activity::query()
            ->select('subject_type')
            ->distinct()
            ->pluck('subject_type')
            ->filter()
            ->map(function ($type): array {
                $short = class_basename((string) $type);

                return ['value' => $short, 'label' => ActivityResource::SUBJECT_LABELS[$short] ?? $short];
            })
            ->sortBy('label')
            ->values();

        $events = Activity::query()
            ->select('event')
            ->distinct()
            ->pluck('event')
            ->filter()
            ->map(fn ($e): array => ['value' => $e, 'label' => ActivityResource::EVENT_LABELS[(string) $e] ?? (string) $e])
            ->values();

        return $this->ok([
            'subjects' => $subjects,
            'events' => $events,
            'users' => User::query()->select('id', 'name')->orderBy('name')->get(),
        ]);
    }
}
