<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends ApiController
{
    public function __construct(private readonly UserService $users) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->users->list(
            $request->string('search')->toString() ?: null,
            $this->perPage($request, 15),
        );

        return $this->paginated($paginator, UserResource::class);
    }

    /**
     * قائمة الطاقم القابلين للإسناد (المعرّف + الاسم فقط) — لقوائم «المكلّف/المدير» في النماذج
     * التشغيلية (مهام/مشاريع/طلبات/زيارات). متاحة لأي عضو طاقم بلا حاجة إلى users.view (التي
     * تخصّ إدارة المستخدمين) — طلب أيمن 2026-08-17: الموظف يضيف مهمة ويسندها دون كشف بيانات
     * إدارة المستخدمين. حسابات العملاء ممنوعة.
     */
    public function assignable(Request $request): JsonResponse
    {
        abort_if($request->user()?->contact_id !== null, 403, 'غير متاح لحسابات العملاء.');

        $users = User::whereNull('contact_id')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $u): array => ['id' => $u->id, 'name' => $u->name]);

        return $this->ok($users);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->users->create($request->validated());

        return $this->created(new UserResource($user), 'تم إنشاء المستخدم');
    }

    public function show(User $user): JsonResponse
    {
        return $this->ok(new UserResource($user->load('roles')));
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user = $this->users->update($user, $request->validated());

        return $this->ok(new UserResource($user), 'تم تحديث المستخدم');
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()?->id === $user->id) {
            return $this->fail('لا يمكنك حذف حسابك الخاص', 422);
        }

        $this->users->delete($user);

        return $this->ok(null, 'تم حذف المستخدم');
    }

    /**
     * دخول المالك بحساب أي موظف (impersonation) — اجتماع 2026-08-05.
     * لمدير النظام فقط؛ يُصدر توكن الهدف ليتصفّح الواجهة ببياناته. تحتفظ الواجهة
     * بتوكن المالك للعودة، ويظهر شريط «تتصفّح بحساب X — عودة».
     */
    public function impersonate(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor?->hasRole('super_admin'), 403, 'الدخول بحساب موظف متاح لمدير النظام فقط.');
        abort_if($actor->id === $user->id, 422, 'لا يمكنك الدخول بحسابك نفسه.');
        abort_if($user->hasRole('super_admin'), 422, 'لا يمكن الدخول بحساب مدير نظام آخر.');

        $token = $user->createToken('impersonation')->plainTextToken;

        return $this->ok([
            'token' => $token,
            'user' => new UserResource($user->load('roles')),
        ], "دخلت بحساب {$user->name}");
    }
}
