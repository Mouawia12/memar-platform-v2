<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\Contact;
use App\Models\FieldVisit;
use App\Models\Invoice;
use App\Models\JobOpening;
use App\Models\Project;
use App\Models\ServiceRequest;
use App\Models\StoredFile;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * البحث الشامل في المنصة — يعيد فقط ما يملك المستخدم صلاحية عرضه.
 */
class SearchController extends ApiController
{
    private const PER_GROUP = 5;

    public function index(Request $request): JsonResponse
    {
        $q = trim($request->string('q')->toString());
        $user = $request->user();

        if (mb_strlen($q) < 2) {
            return $this->ok(['query' => $q, 'groups' => []]);
        }

        $like = "%{$q}%";
        $groups = [];

        if ($user?->can('projects.view')) {
            $groups[] = $this->group('المشاريع', '🏗️', Project::query()
                ->where(fn ($b) => $b->where('name', 'like', $like)->orWhere('code', 'like', $like))
                ->limit(self::PER_GROUP)->get()
                ->map(fn (Project $p): array => ['title' => $p->name, 'subtitle' => $p->code, 'path' => '/projects']));

            $groups[] = $this->group('الزيارات الميدانية', '🚧', FieldVisit::query()
                ->where(fn ($b) => $b->where('title', 'like', $like)->orWhere('location', 'like', $like))
                ->limit(self::PER_GROUP)->get()
                ->map(fn (FieldVisit $v): array => ['title' => $v->title, 'subtitle' => $v->location, 'path' => '/field-visits']));
        }

        if ($user?->can('crm.view')) {
            $groups[] = $this->group('العملاء', '👥', Contact::query()
                ->where(fn ($b) => $b->where('full_name', 'like', $like)->orWhere('phone', 'like', $like)->orWhere('company', 'like', $like))
                ->limit(self::PER_GROUP)->get()
                ->map(fn (Contact $c): array => ['title' => $c->full_name, 'subtitle' => $c->phone ?? $c->company, 'path' => $c->type === 'lead' ? '/crm' : '/clients']));
        }

        if ($user?->can('tasks.view')) {
            $groups[] = $this->group('المهام', '✅', Task::query()
                ->where('title', 'like', $like)
                ->limit(self::PER_GROUP)->get()
                ->map(fn (Task $t): array => ['title' => $t->title, 'subtitle' => $t->due_date?->toDateString(), 'path' => '/tasks']));
        }

        if ($user?->can('finance.view')) {
            $groups[] = $this->group('الفواتير', '🧾', Invoice::query()
                ->where('number', 'like', $like)
                ->limit(self::PER_GROUP)->get()
                ->map(fn (Invoice $i): array => ['title' => $i->number ?? "#{$i->id}", 'subtitle' => $i->total_kwd.' د.ك', 'path' => '/finance/invoices']));
        }

        if ($user?->can('requests.view')) {
            $groups[] = $this->group('الطلبات', '📩', ServiceRequest::query()
                ->where(fn ($b) => $b->where('title', 'like', $like)->orWhere('client_name', 'like', $like))
                ->limit(self::PER_GROUP)->get()
                ->map(fn (ServiceRequest $r): array => ['title' => $r->title, 'subtitle' => $r->client_name, 'path' => '/requests']));
        }

        if ($user?->can('documents.view')) {
            $groups[] = $this->group('الملفات', '🗂️', StoredFile::query()
                ->where(fn ($b) => $b->where('name', 'like', $like)->orWhere('original_name', 'like', $like))
                ->limit(self::PER_GROUP)->get()
                ->map(fn (StoredFile $f): array => ['title' => $f->name, 'subtitle' => $f->folder, 'path' => '/files']));
        }

        if ($user?->can('hr.view')) {
            $groups[] = $this->group('الوظائف', '💼', JobOpening::query()
                ->where('title', 'like', $like)
                ->limit(self::PER_GROUP)->get()
                ->map(fn (JobOpening $j): array => ['title' => $j->title, 'subtitle' => $j->department, 'path' => '/careers']));
        }

        return $this->ok([
            'query' => $q,
            'groups' => array_values(array_filter($groups, fn (array $g): bool => $g['items'] !== [])),
        ]);
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $items
     * @return array<string, mixed>
     */
    private function group(string $label, string $icon, $items): array
    {
        return ['label' => $label, 'icon' => $icon, 'items' => $items->values()->all()];
    }
}
