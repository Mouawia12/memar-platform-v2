<?php

declare(strict_types=1);

use App\Models\Role;
use Illuminate\Database\Migrations\Migration;

/**
 * سجل المشاريع يُفتح لكل الأدوار (طلب أيمن 2026-09-17): «أنا عايز كل الناس تشوف
 * كل المشاريع، وقدام كل مشروع اسم المسؤول عنه».
 *
 * كانت شاشة الصلاحيات تكتب scope.projects = 'assigned' على كل حفظ، فيُحبس الموظف
 * في مشاريعه هو. نفتح المخزَّن لمرّة واحدة، ونحفظ القيمة القديمة في projects_legacy
 * كي يُمكن الرجوع إليها لو أراد المكتب تقييد دور بعينه لاحقًا.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (Role::all() as $role) {
            $settings = (array) ($role->getAttribute('settings') ?? []);
            $scope = (array) ($settings['scope'] ?? []);
            if (($scope['projects'] ?? 'all') === 'all') {
                continue;
            }

            $scope['projects_legacy'] = $scope['projects'];
            $scope['projects'] = 'all';
            $settings['scope'] = $scope;
            $role->settings = $settings;
            $role->save();
        }
    }

    public function down(): void
    {
        foreach (Role::all() as $role) {
            $settings = (array) ($role->getAttribute('settings') ?? []);
            $scope = (array) ($settings['scope'] ?? []);
            if (! isset($scope['projects_legacy'])) {
                continue;
            }

            $scope['projects'] = $scope['projects_legacy'];
            unset($scope['projects_legacy']);
            $settings['scope'] = $scope;
            $role->settings = $settings;
            $role->save();
        }
    }
};
