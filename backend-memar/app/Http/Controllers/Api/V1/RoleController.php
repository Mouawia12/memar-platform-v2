<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Role;

class RoleController extends ApiController
{
    /** قائمة الأدوار (للاختيار في نماذج المستخدمين). */
    public function index(): JsonResponse
    {
        $labels = [
            'super_admin' => 'مدير عام',
            'manager' => 'مدير',
            'architect' => 'مهندس معماري',
            'accountant' => 'محاسب',
            'hr_manager' => 'مدير موارد بشرية',
            'client' => 'عميل',
        ];

        $roles = Role::orderBy('id')->get()->map(fn (Role $role): array => [
            'name' => $role->name,
            'label' => $labels[$role->name] ?? $role->name,
        ]);

        return $this->ok($roles);
    }
}
