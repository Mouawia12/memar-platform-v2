<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Employee>
 */
class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $departments = ['الإدارة', 'التصميم', 'الإنشاء', 'المالية', 'العمليات'];

        return [
            'full_name' => fake()->name(),
            'job_title' => fake()->randomElement(['مهندس معماري', 'مهندس إنشائي', 'مدير مشاريع', 'محاسب', 'إداري']),
            'department' => fake()->randomElement($departments),
            'hire_date' => fake()->dateTimeBetween('-4 years', '-1 month')->format('Y-m-d'),
            'base_salary_kwd' => fake()->numberBetween(500, 2500),
            'phone' => fake()->numerify('9#######'),
            'status' => 'active',
        ];
    }

    public function left(): static
    {
        return $this->state(fn () => ['status' => 'left']);
    }
}
