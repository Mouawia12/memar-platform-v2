<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\ClientMessage;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * الشات المباشر لطاقم معمار (الأدمن + الموظفين):
 *  - محادثات داخلية بين المستخدمين (فردية/جماعية) عبر جدول conversations.
 *  - محادثات الطاقم مع العملاء عبر جدول client_messages القائم (نفس ما يراه العميل في بوابته).
 *
 * جميع المسارات للطاقم فقط (المستخدم غير المرتبط بسجل عميل).
 */
class ChatController extends ApiController
{
    /** يتأكّد أن المستخدم من الطاقم (ليس حساب عميل)، وإلا 403. */
    private function staffOnly(Request $request): User
    {
        $user = $request->user();
        abort_if($user === null || $user->contact_id !== null, 403, 'الشات الداخلي متاح لطاقم معمار فقط.');

        return $user;
    }

    // ─────────────────────────── محادثات داخلية ───────────────────────────

    /** قائمة زملاء الطاقم لبدء محادثة معهم. */
    public function staff(Request $request): JsonResponse
    {
        $me = $this->staffOnly($request);

        $users = User::whereNull('contact_id')
            ->where('id', '!=', $me->id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $u): array => [
                'id' => $u->id,
                'name' => $u->name,
                'role' => $u->getRoleNames()->first(),
            ])->all();

        return $this->ok($users);
    }

    /** محادثاتي الداخلية مع آخر رسالة وعدّاد غير المقروء. */
    public function conversations(Request $request): JsonResponse
    {
        $me = $this->staffOnly($request);

        $conversations = Conversation::whereHas('participants', fn ($q) => $q->where('user_id', $me->id))
            ->with(['participants.user:id,name', 'messages' => fn ($q) => $q->latest()->limit(1)])
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->get()
            ->map(function (Conversation $c) use ($me): array {
                $mine = $c->participants->firstWhere('user_id', $me->id);
                $lastRead = $mine?->last_read_at;
                $unread = $c->messages()
                    ->where('sender_user_id', '!=', $me->id)
                    ->when($lastRead !== null, fn ($q) => $q->where('created_at', '>', $lastRead))
                    ->count();
                $others = $c->participants->where('user_id', '!=', $me->id)->map(fn ($p) => $p->user?->name)->filter()->values();
                $last = $c->messages->first();

                return [
                    'id' => $c->id,
                    'type' => $c->type,
                    'title' => $c->type === 'group' ? ($c->title ?: 'محادثة جماعية') : ($others->first() ?? 'محادثة'),
                    'members' => $others->all(),
                    'last_message' => $last?->body,
                    'last_message_at' => ($last?->created_at ?? $c->last_message_at)?->toIso8601String(),
                    'unread' => $unread,
                ];
            })->all();

        return $this->ok($conversations);
    }

    /** إنشاء محادثة داخلية: فردية (user_id) أو جماعية (title + user_ids[]). */
    public function createConversation(Request $request): JsonResponse
    {
        $me = $this->staffOnly($request);

        $data = $request->validate([
            'type' => ['required', Rule::in(['direct', 'group'])],
            'user_id' => ['required_if:type,direct', 'integer', 'exists:users,id'],
            'title' => ['nullable', 'string', 'max:120'],
            'user_ids' => ['required_if:type,group', 'array', 'min:1', 'max:50'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        // منع مخاطبة حسابات العملاء عبر الشات الداخلي.
        $targetIds = $data['type'] === 'direct' ? [(int) $data['user_id']] : array_map('intval', $data['user_ids']);
        $clientTargets = User::whereIn('id', $targetIds)->whereNotNull('contact_id')->count();
        if ($clientTargets > 0) {
            throw ValidationException::withMessages(['user_ids' => 'لا يمكن إضافة حساب عميل إلى الشات الداخلي — استخدم محادثة العملاء.']);
        }

        if ($data['type'] === 'direct') {
            $otherId = (int) $data['user_id'];
            // البحث عن محادثة فردية قائمة بين الطرفين قبل إنشاء واحدة جديدة.
            $existing = Conversation::where('type', 'direct')
                ->whereHas('participants', fn ($q) => $q->where('user_id', $me->id))
                ->whereHas('participants', fn ($q) => $q->where('user_id', $otherId))
                ->first();
            if ($existing !== null) {
                return $this->ok(['id' => $existing->id], 'المحادثة موجودة');
            }

            $conversation = Conversation::create(['type' => 'direct', 'created_by' => $me->id]);
            $conversation->participants()->createMany([['user_id' => $me->id], ['user_id' => $otherId]]);

            return $this->created(['id' => $conversation->id], 'تم إنشاء المحادثة');
        }

        $ids = array_values(array_unique(array_merge([$me->id], $targetIds)));
        $conversation = Conversation::create(['type' => 'group', 'title' => $data['title'] ?? 'محادثة جماعية', 'created_by' => $me->id]);
        $conversation->participants()->createMany(array_map(fn (int $id): array => ['user_id' => $id], $ids));

        return $this->created(['id' => $conversation->id], 'تم إنشاء المحادثة الجماعية');
    }

    /** رسائل محادثة داخلية + تعليمها مقروءة. */
    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        $me = $this->staffOnly($request);
        $mine = $conversation->participants()->where('user_id', $me->id)->first();
        abort_if($mine === null, 403, 'لست عضوًا في هذه المحادثة.');

        $messages = $conversation->messages()
            ->with('sender:id,name')
            ->orderBy('created_at')
            ->limit(500)
            ->get()
            ->map(fn (ConversationMessage $m): array => [
                'id' => $m->id,
                'body' => $m->body,
                'mine' => $m->sender_user_id === $me->id,
                'sender' => $m->sender?->name,
                'at' => $m->created_at?->toIso8601String(),
            ])->all();

        $mine->update(['last_read_at' => now()]);

        return $this->ok($messages);
    }

    /** إرسال رسالة في محادثة داخلية. */
    public function send(Request $request, Conversation $conversation): JsonResponse
    {
        $me = $this->staffOnly($request);
        $mine = $conversation->participants()->where('user_id', $me->id)->first();
        abort_if($mine === null, 403, 'لست عضوًا في هذه المحادثة.');

        $data = $request->validate(['body' => ['required', 'string', 'max:5000']]);

        $message = $conversation->messages()->create(['sender_user_id' => $me->id, 'body' => $data['body']]);
        $conversation->update(['last_message_at' => $message->created_at]);
        $mine->update(['last_read_at' => now()]);

        return $this->created([
            'id' => $message->id,
            'body' => $message->body,
            'mine' => true,
            'sender' => $me->name,
            'at' => $message->created_at?->toIso8601String(),
        ], 'تم الإرسال');
    }

    // ─────────────────────────── محادثات العملاء ───────────────────────────

    /** قائمة محادثات العملاء (من client_messages) — آخر رسالة + هل بانتظار ردّ الطاقم. */
    public function clientThreads(Request $request): JsonResponse
    {
        $this->staffOnly($request);

        // جهات الاتصال التي لها رسائل، أو لها حساب عميل (يمكن بدء محادثة معها).
        $withMessages = ClientMessage::query()->distinct()->pluck('contact_id');
        $withAccounts = User::whereNotNull('contact_id')->pluck('contact_id');
        $contactIds = $withMessages->merge($withAccounts)->unique()->values();

        $contacts = Contact::whereIn('id', $contactIds)->get(['id', 'full_name', 'company', 'phone']);

        $threads = $contacts->map(function (Contact $c): array {
            $last = ClientMessage::where('contact_id', $c->id)->latest()->first();
            $awaiting = $last !== null && $last->from_staff === false; // آخر رسالة من العميل ⇒ بانتظار ردّنا

            return [
                'contact_id' => $c->id,
                'name' => $c->full_name,
                'company' => $c->company,
                'phone' => $c->phone,
                'last_message' => $last?->body,
                'last_message_at' => $last?->created_at?->toIso8601String(),
                'awaiting_reply' => $awaiting,
            ];
        })
            ->sortByDesc(fn (array $t): string => $t['last_message_at'] ?? '')
            ->values()
            ->all();

        return $this->ok($threads);
    }

    /** رسائل محادثة عميل معيّن. */
    public function clientMessages(Request $request, Contact $contact): JsonResponse
    {
        $this->staffOnly($request);

        $messages = ClientMessage::where('contact_id', $contact->id)
            ->orderBy('created_at')
            ->limit(500)
            ->get()
            ->map(fn (ClientMessage $m): array => [
                'id' => $m->id,
                'body' => $m->body,
                'from_staff' => $m->from_staff,
                'at' => $m->created_at?->toIso8601String(),
            ])->all();

        return $this->ok([
            'contact' => ['id' => $contact->id, 'name' => $contact->full_name, 'company' => $contact->company, 'phone' => $contact->phone],
            'messages' => $messages,
        ]);
    }

    /** ردّ الطاقم على العميل — يُحفظ في client_messages (from_staff) ليظهر في بوابة العميل مباشرة. */
    public function clientSend(Request $request, Contact $contact): JsonResponse
    {
        $me = $this->staffOnly($request);
        $data = $request->validate(['body' => ['required', 'string', 'max:5000']]);

        $message = ClientMessage::create([
            'contact_id' => $contact->id,
            'from_staff' => true,
            'body' => $data['body'],
            'sender_user_id' => $me->id,
        ]);

        return $this->created([
            'id' => $message->id,
            'body' => $message->body,
            'from_staff' => true,
            'at' => $message->created_at?->toIso8601String(),
        ], 'تم إرسال الرد للعميل');
    }

    /** ملخّص عدد الرسائل غير المقروءة (للشارة العلوية) — اختياري. */
    public function unreadSummary(Request $request): JsonResponse
    {
        $me = $this->staffOnly($request);

        $internal = DB::table('conversation_messages as m')
            ->join('conversation_participants as p', 'p.conversation_id', '=', 'm.conversation_id')
            ->where('p.user_id', $me->id)
            ->where('m.sender_user_id', '!=', $me->id)
            ->where(function ($q): void {
                $q->whereNull('p.last_read_at')->orWhereColumn('m.created_at', '>', 'p.last_read_at');
            })
            ->count();

        $clientAwaiting = ClientMessage::whereIn('id', function ($q): void {
            $q->selectRaw('MAX(id)')->from('client_messages')->groupBy('contact_id');
        })->where('from_staff', false)->count();

        return $this->ok(['internal' => $internal, 'client_awaiting' => $clientAwaiting]);
    }
}
