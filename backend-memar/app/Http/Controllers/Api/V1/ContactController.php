<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Contacts\StoreContactRequest;
use App\Http\Requests\Contacts\UpdateContactRequest;
use App\Http\Resources\ContactResource;
use App\Models\Contact;
use App\Services\ContactService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends ApiController
{
    public function __construct(private readonly ContactService $contacts) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->contacts->list(
            $request->string('search')->toString() ?: null,
            $request->string('type')->toString() ?: null,
            $this->perPage($request, 15),
        );

        return $this->paginated($paginator, ContactResource::class);
    }

    public function store(StoreContactRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['owner_id'] = $request->user()?->id;

        $contact = $this->contacts->create($data);

        return $this->created(new ContactResource($contact), 'تم إضافة العميل');
    }

    public function show(Contact $contact): JsonResponse
    {
        return $this->ok(new ContactResource($contact->load('owner')));
    }

    public function update(UpdateContactRequest $request, Contact $contact): JsonResponse
    {
        $contact = $this->contacts->update($contact, $request->validated());

        return $this->ok(new ContactResource($contact), 'تم تحديث العميل');
    }

    public function destroy(Contact $contact): JsonResponse
    {
        $this->contacts->delete($contact);

        return $this->ok(null, 'تم حذف العميل');
    }
}
