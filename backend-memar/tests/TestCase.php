<?php

declare(strict_types=1);

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;

abstract class TestCase extends BaseTestCase
{
    /**
     * ينشئ مستخدمًا مصادَقًا يملك الصلاحيات المطلوبة (guard: web) عبر Sanctum.
     *
     * @param  array<int, string>  $permissions
     */
    protected function actingAsUserWith(array $permissions = []): User
    {
        $user = User::factory()->create();

        foreach ($permissions as $name) {
            Permission::findOrCreate($name, 'web');
        }
        $user->givePermissionTo($permissions);

        Sanctum::actingAs($user);

        return $user;
    }
}
