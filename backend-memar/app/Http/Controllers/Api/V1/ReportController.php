<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\Salary;
use Illuminate\Http\JsonResponse;

class ReportController extends ApiController
{
    /** ملخّص مالي مجمّع (للتقارير). */
    public function summary(): JsonResponse
    {
        $invTotal = (float) Invoice::sum('total_kwd');
        $invPaid = (float) Invoice::sum('paid_kwd');

        $invoices = [
            'count' => Invoice::count(),
            'total' => round($invTotal, 3),
            'paid' => round($invPaid, 3),
            'outstanding' => round($invTotal - $invPaid, 3),
            'overdue_count' => Invoice::whereDate('due_date', '<', now())
                ->whereNotIn('status', ['paid', 'cancelled'])
                ->count(),
            'by_status' => Invoice::selectRaw('status, count(*) as c, sum(total_kwd) as v')
                ->groupBy('status')->get()
                ->map(fn ($r) => ['status' => $r->status, 'count' => (int) $r->c, 'value' => round((float) $r->v, 3)]),
        ];

        $contracts = [
            'count' => Contract::count(),
            'total_value' => round((float) Contract::sum('value_kwd'), 3),
            'by_status' => Contract::selectRaw('status, count(*) as c, sum(value_kwd) as v')
                ->groupBy('status')->get()
                ->map(fn ($r) => ['status' => $r->status, 'count' => (int) $r->c, 'value' => round((float) $r->v, 3)]),
        ];

        $payroll = [
            'count' => Salary::count(),
            'paid_net' => round((float) Salary::where('status', 'paid')->sum('net_kwd'), 3),
            'draft_net' => round((float) Salary::where('status', 'draft')->sum('net_kwd'), 3),
        ];

        $projects = [
            'total' => Project::count(),
            'active' => Project::where('status', 'active')->count(),
        ];

        return $this->ok([
            'invoices' => $invoices,
            'contracts' => $contracts,
            'payroll' => $payroll,
            'projects' => $projects,
        ]);
    }
}
