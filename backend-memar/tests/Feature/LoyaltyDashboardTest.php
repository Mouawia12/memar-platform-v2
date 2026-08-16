<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\PipelineStage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoyaltyDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_returns_sections(): void
    {
        PipelineStage::firstOrCreate(['key' => 'new'], ['label' => 'ج', 'color' => '#888', 'position' => 1, 'is_won' => false, 'is_lost' => false, 'is_protected' => true]);
        Contact::create(['full_name' => 'a', 'type' => 'lead', 'stage' => 'new', 'is_urgent' => true, 'is_vip' => true]);

        $this->actingAsUserWith(['loyalty.view']);

        $this->getJson('/api/v1/loyalty/dashboard')->assertOk()
            ->assertJsonPath('data.leads.total', 1)
            ->assertJsonPath('data.leads.urgent', 1)
            ->assertJsonStructure(['data' => ['leads', 'points', 'financial', 'ranking', 'approvals' => ['earned', 'redemptions']]]);
    }

    public function test_dashboard_forbidden_without_permission(): void
    {
        $this->actingAsUserWith(['self.view']);
        $this->getJson('/api/v1/loyalty/dashboard')->assertForbidden();
    }
}
