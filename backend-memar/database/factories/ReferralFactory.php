<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Contact;
use App\Models\Referral;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Referral>
 */
class ReferralFactory extends Factory
{
    protected $model = Referral::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'referrer_contact_id' => Contact::factory(),
            'referred_name' => fake()->name(),
            'status' => fake()->randomElement(['pending', 'joined', 'contracted']),
            'is_gift' => fake()->boolean(30),
        ];
    }

    public function contracted(): static
    {
        return $this->state(['status' => 'contracted']);
    }
}
