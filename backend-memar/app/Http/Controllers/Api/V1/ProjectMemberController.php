<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\Project;
use App\Models\User;
use App\Services\ProjectMemberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * إسناد الموظفين إلى مشروع (الأدمن) + قائمة المُسنَدين + الموظفون القابلون للإسناد.
 */
class ProjectMemberController extends ApiController
{
    public function __construct(private readonly ProjectMemberService $members) {}

    /** المُسنَدون لهذا المشروع مع دورهم وآخر دخولهم. */
    public function index(Project $project): JsonResponse
    {
        $rows = $project->members()->orderBy('users.name')->get()->map(fn (User $u): array => [
            'id' => $u->id,
            'name' => $u->name,
            'avatar_url' => $u->avatarDataUri(),
            'role_on_project' => $u->pivot->role_on_project,
            'assigned_at' => $u->pivot->assigned_at?->toIso8601String(),
            'last_seen_at' => $u->pivot->last_seen_at?->toIso8601String(),
        ]);

        return $this->ok($rows);
    }

    /** الموظفون غير المُسنَدين بعد (لقائمة الإضافة). */
    public function assignable(Project $project): JsonResponse
    {
        $memberIds = $project->members()->pluck('users.id');

        $staff = User::query()
            ->where('is_active', true)
            ->whereNull('contact_id') // طاقم داخلي (لا مستخدمي بوابة عملاء)
            ->whereNotIn('id', $memberIds)
            ->orderBy('name')
            ->get(['id', 'name']);

        return $this->ok($staff);
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'role_on_project' => ['nullable', 'string', 'max:100'],
        ]);

        $user = User::findOrFail($data['user_id']);
        $this->members->assign($project, $user, $data['role_on_project'] ?? null, $request->user());

        return $this->ok(null, 'تم إسناد الموظف للمشروع');
    }

    public function destroy(Project $project, User $user): JsonResponse
    {
        $this->members->unassign($project, $user);

        return $this->ok(null, 'تم إلغاء الإسناد');
    }
}
