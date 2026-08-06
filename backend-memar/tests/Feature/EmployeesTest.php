<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use Database\Seeders\EmployeesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeesTest extends TestCase
{
    use RefreshDatabase;

    public function test_listing_requires_hr_view_permission(): void
    {
        $this->actingAsUserWith([]); // بلا صلاحيات

        $this->getJson('/api/v1/employees')->assertForbidden();
    }

    public function test_lists_employees_paginated(): void
    {
        $this->actingAsUserWith(['hr.view']);
        Employee::factory()->count(3)->create();

        $res = $this->getJson('/api/v1/employees');

        $res->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure(['data' => [['id', 'full_name', 'job_title', 'department', 'base_salary_kwd', 'status']], 'meta']);
    }

    public function test_search_filters_by_name_or_department(): void
    {
        $this->actingAsUserWith(['hr.view']);
        Employee::factory()->create(['full_name' => 'سالم المطيري', 'department' => 'الإدارة']);
        Employee::factory()->create(['full_name' => 'دعاء السالم', 'department' => 'التصميم']);

        $this->getJson('/api/v1/employees?'.http_build_query(['search' => 'التصميم']))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.full_name', 'دعاء السالم');
    }

    public function test_status_filter(): void
    {
        $this->actingAsUserWith(['hr.view']);
        Employee::factory()->count(2)->create(['status' => 'active']);
        Employee::factory()->left()->create();

        $this->getJson('/api/v1/employees?status=left')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'left');
    }

    public function test_creating_requires_hr_manage_permission(): void
    {
        $this->actingAsUserWith(['hr.view']); // عرض فقط، لا إدارة

        $this->postJson('/api/v1/employees', ['full_name' => 'موظف جديد'])
            ->assertForbidden();
    }

    public function test_creates_employee(): void
    {
        $this->actingAsUserWith(['hr.view', 'hr.manage']);

        $res = $this->postJson('/api/v1/employees', [
            'full_name' => 'م. جديد',
            'job_title' => 'مهندس',
            'department' => 'التصميم',
            'base_salary_kwd' => 800,
            'status' => 'active',
        ]);

        $res->assertCreated()->assertJsonPath('data.full_name', 'م. جديد');
        $this->assertDatabaseHas('employees', ['full_name' => 'م. جديد', 'department' => 'التصميم']);
    }

    public function test_updates_employee(): void
    {
        $this->actingAsUserWith(['hr.view', 'hr.manage']);
        $employee = Employee::factory()->create(['base_salary_kwd' => 700]);

        $this->patchJson("/api/v1/employees/{$employee->id}", ['base_salary_kwd' => 900])
            ->assertOk()
            ->assertJsonPath('data.base_salary_kwd', '900.000');

        $this->assertDatabaseHas('employees', ['id' => $employee->id, 'base_salary_kwd' => 900]);
    }

    public function test_deletes_employee_softly(): void
    {
        $this->actingAsUserWith(['hr.view', 'hr.manage']);
        $employee = Employee::factory()->create();

        $this->deleteJson("/api/v1/employees/{$employee->id}")->assertOk();

        $this->assertSoftDeleted('employees', ['id' => $employee->id]);
    }

    public function test_seeder_creates_full_roster_and_is_idempotent(): void
    {
        (new EmployeesSeeder())->run();
        $countAfterFirst = Employee::count();

        (new EmployeesSeeder())->run(); // إعادة التشغيل يجب ألا تكرّر

        $this->assertSame($countAfterFirst, Employee::count());
        $this->assertSame(10, $countAfterFirst);
        $this->assertDatabaseHas('employees', ['full_name' => 'م. أيمن الطوخي', 'department' => 'الإدارة']);
    }

    public function test_seeder_links_employees_to_matching_user_accounts(): void
    {
        $user = User::factory()->create(['email' => 'acc@memar.kw']);

        (new EmployeesSeeder())->run();

        $this->assertDatabaseHas('employees', [
            'full_name' => 'أ. وليد ناصر',
            'user_id' => $user->id,
        ]);
    }
}
