<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ClientMessage;
use App\Models\Contact;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ClientMessage>
 */
class ClientMessageFactory extends Factory
{
    protected $model = ClientMessage::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'contact_id' => Contact::factory(),
            'from_staff' => false,
            'body' => fake()->sentence(),
        ];
    }

    public function fromStaff(): static
    {
        return $this->state(['from_staff' => true]);
    }
}
