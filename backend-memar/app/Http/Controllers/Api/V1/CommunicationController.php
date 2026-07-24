<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Communications\StoreCommunicationRequest;
use App\Http\Requests\Communications\UpdateCommunicationRequest;
use App\Http\Resources\CommunicationResource;
use App\Models\Communication;
use App\Services\CommunicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunicationController extends ApiController
{
    public function __construct(private readonly CommunicationService $communications) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->communications->list(
            $request->string('search')->toString() ?: null,
            $request->string('channel')->toString() ?: null,
            $this->perPage($request, 20),
        );

        return $this->paginated($paginator, CommunicationResource::class);
    }

    public function store(StoreCommunicationRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['logged_by'] = $request->user()?->id;

        $communication = $this->communications->create($data);

        return $this->created(new CommunicationResource($communication), 'تم تسجيل التواصل');
    }

    public function show(Communication $communication): JsonResponse
    {
        return $this->ok(new CommunicationResource($communication->load('logger:id,name')));
    }

    public function update(UpdateCommunicationRequest $request, Communication $communication): JsonResponse
    {
        $communication = $this->communications->update($communication, $request->validated());

        return $this->ok(new CommunicationResource($communication), 'تم تحديث التواصل');
    }

    public function destroy(Communication $communication): JsonResponse
    {
        $this->communications->delete($communication);

        return $this->ok(null, 'تم حذف التواصل');
    }
}
