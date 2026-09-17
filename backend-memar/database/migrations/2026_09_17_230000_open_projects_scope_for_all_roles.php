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

            // النسخة القديمة خارج scope: شاشة الأدوار تقصّ مفاتيح scope على المعروفة
            // فتمحوها مع أول حفظ، فيصير التراجع لا-عملية صامتة.
            $settings['scope_projects_legacy'] = $scope['projects'];
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
            if (! isset($settings['scope_projects_legacy'])) {
                continue;
            }

            $scope = (array) ($settings['scope'] ?? []);
            $scope['projects'] = $settings['scope_projects_legacy'];
            unset($settings['scope_projects_legacy']);
            $settings['scope'] = $scope;
            $role->settings = $settings;
            $role->save();
        }
    }
};
