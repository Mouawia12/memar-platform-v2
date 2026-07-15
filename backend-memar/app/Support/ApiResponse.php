<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Standard API response envelope for the whole platform.
 *
 * Shape: { success, message, data, errors, meta }
 * — يضمن شكلًا موحّدًا لكل استجابات الـAPI (نجاح/خطأ/صفحات).
 */
final class ApiResponse
{
    /**
     * استجابة نجاح موحّدة.
     */
    public static function success(
        mixed $data = null,
        ?string $message = null,
        int $status = 200,
        ?array $meta = null,
    ): JsonResponse {
        $payload = [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];

        if ($meta !== null) {
            $payload['meta'] = $meta;
        }

        return response()->json($payload, $status);
    }

    /**
     * استجابة خطأ موحّدة.
     *
     * @param  array<string, mixed>|null  $errors
     */
    public static function error(
        string $message,
        int $status = 400,
        ?array $errors = null,
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }

    /**
     * استجابة مصفوفة مصفّحة (Pagination) مع meta.
     */
    public static function paginated(
        LengthAwarePaginator $paginator,
        ?string $resourceClass = null,
        ?string $message = null,
    ): JsonResponse {
        $items = $paginator->getCollection();

        $data = $resourceClass !== null
            ? $resourceClass::collection($items)
            : $items;

        return self::success($data, $message, 200, [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
        ]);
    }

    /**
     * تغليف JsonResource داخل الظرف الموحّد.
     */
    public static function resource(
        JsonResource|AnonymousResourceCollection $resource,
        ?string $message = null,
        int $status = 200,
    ): JsonResponse {
        return self::success($resource, $message, $status);
    }
}
