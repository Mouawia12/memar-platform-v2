<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Contact;
use App\Models\TeamMember;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TeamMember>
 */
class TeamMemberFactory extends Factory
{
    protected $model = TeamMember::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'contact_id' => Contact::factory(),
            'name' => fake()->name(),
            'role' => fake()->randomElement(['مدير مشاريع', 'مهندس متابعة', 'مشارك']),
        ];
    }
}
