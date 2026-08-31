<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;

/**
 * منطق إدارة المستخدمين.
 */
class UserService
{
    public function list(?string $search, int $perPage = 15): LengthAwarePaginator
    {
        return User::query()
            ->when($search, function ($query, string $s): void {
                $query->where(function ($q) use ($s): void {
                    $q->where('name', 'like', "%{$s}%")
                        ->orWhere('email', 'like', "%{$s}%");
                });
            })
            ->with('roles')
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
            'is_active' => $data['is_active'] ?? true,
        ]);

        $user->syncRoles($data['roles'] ?? []);

        return $user->load('roles');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(User $user, array $data): User
    {
        $user->fill([
            'name' => $data['name'] ?? $user->name,
            'email' => $data['email'] ?? $user->email,
            'phone' => $data['phone'] ?? $user->phone,
            'is_active' => $data['is_active'] ?? $user->is_active,
        ]);

        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        if (array_key_exists('roles', $data)) {
            $user->syncRoles($data['roles']);
        }

        return $user->load('roles');
    }

    public function delete(User $user): void
    {
        $user->delete();
    }

    /**
     * استثناءات الموظف: صلاحيات مباشرة فوق دوره (طلب أيمن 2026-08-31).
     *
     * «كل المهندسين كذا، إلا فلانًا فله التسعير أيضًا» — تُخزَّن على المستخدم
     * نفسه لا على دوره، فلا تمسّ زملاءه. وهي إضافةٌ لا سحب: ما منحه الدور لا
     * يُنتزع من فرد (حدٌّ في مكتبة الصلاحيات)، فالسحب يكون بتضييق الدور.
     *
     * @param  array<int, string>  $permissions  أسماء الصلاحيات المباشرة كاملةً
     * @return array<int, string> الصلاحيات المباشرة بعد المزامنة
     */
    public function syncDirectPermissions(User $user, array $permissions): array
    {
        $valid = Permission::whereIn('name', $permissions)->where('guard_name', 'web')->pluck('name')->all();
        $user->syncPermissions($valid);

        return $user->fresh()->getDirectPermissions()->pluck('name')->values()->all();
    }
}
