<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * الأساس لكل متحكمات الـAPI — يوفّر اختصارات الاستجابة الموحّدة.
 * كل متحكمات v1 ترث منه لتبقى رفيعة (thin controllers).
 */
abstract class ApiController extends Controller
{
    protected function ok(mixed $data = null, ?string $message = null, ?array $meta = null): JsonResponse
    {
        return ApiResponse::success($data, $message, 200, $meta);
    }

    protected function created(mixed $data = null, ?string $message = null): JsonResponse
    {
        return ApiResponse::success($data, $message ?? 'تم الإنشاء بنجاح', 201);
    }

    protected function noContent(): JsonResponse
    {
        return response()->json(null, 204);
    }

    protected function fail(string $message, int $status = 400, ?array $errors = null): JsonResponse
    {
        return ApiResponse::error($message, $status, $errors);
    }

    protected function paginated(LengthAwarePaginator $paginator, ?string $resourceClass = null): JsonResponse
    {
        return ApiResponse::paginated($paginator, $resourceClass);
    }

    /**
     * حجم الصفحة المطلوب مقيّدًا بحدّ أقصى.
     * الحدّ يسمح بتصدير قائمة كاملة دفعةً واحدة، ويمنع استنزاف الذاكرة بطلب ضخم.
     */
    protected function perPage(Request $request, int $default = 15, int $max = 500): int
    {
        $requested = $request->integer('per_page') ?: $default;

        return max(1, min($requested, $max));
    }
}
