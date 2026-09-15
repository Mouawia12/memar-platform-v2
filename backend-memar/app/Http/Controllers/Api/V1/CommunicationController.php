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
        $paginator = $this->communications->list([
            'search' => $request->string('search')->toString() ?: null,
            'channel' => $request->string('channel')->toString() ?: null,
            'contact_type' => $request->string('contact_type')->toString() ?: null,
            'contact_id' => $request->integer('contact_id') ?: null,
            'company_id' => $request->integer('company_id') ?: null,
            'user_id' => $request->integer('user_id') ?: null,
            'follow_up' => $request->string('follow_up')->toString() ?: null,
        ], $this->perPage($request, 20));

        return $this->paginated($paginator, CommunicationResource::class);
    }

    public function stats(Request $request): JsonResponse
    {
        return $this->ok($this->communications->stats($request->user()?->id));
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
        return $this->ok(new CommunicationResource($communication->load('logger:id,name', 'contact:id,full_name', 'company:id,name', 'staffUser:id,name')));
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
