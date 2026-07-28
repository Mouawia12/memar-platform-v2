<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => 'MEP-'.fake()->unique()->numerify('2026-###'),
            'name' => 'مشروع '.fake()->word(),
            'status' => 'active',
            'budget_kwd' => fake()->randomFloat(3, 1000, 100000),
            'start_date' => '2026-01-15',
            'end_date' => '2026-12-30',
            'description' => fake()->sentence(),
        ];
    }
}
