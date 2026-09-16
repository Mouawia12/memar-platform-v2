<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\ClientMessage;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\MessageReaction;
use App\Models\StoredFile;
use App\Models\User;
use App\Services\FileStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * الشات المباشر لطاقم معمار (الأدمن + الموظفين):
 *  - محادثات داخلية بين المستخدمين (فردية/جماعية) عبر جدول conversations.
 *  - محادثات الطاقم مع العملاء عبر جدول client_messages القائم (نفس ما يراه العميل في بوابته).
 *
 * جميع المسارات للطاقم فقط (المستخدم غير المرتبط بسجل عميل).
 */
class ChatController extends ApiController
{
    /** مهلة تعديل الرسالة بعد إرسالها (بالدقائق). */
    private const EDIT_WINDOW_MINUTES = 15;

    /** التفاعلات المسموح بها — قائمة قصيرة تُقرأ بلمحة. */
    private const EMOJIS = ['👍', '✅', '❗', '❤️', '😀', '🙏'];

    public function __construct(private readonly FileStorageService $files) {}

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
            ->get(['id', 'name', 'contact_id'])
            // إنفاذ صلاحيات التواصل من إعدادات الدور: لا يُعرض إلا من يُسمح بمخاطبته.
            ->filter(fn (User $u): bool => $me->canChatWith($u))
            ->map(fn (User $u): array => [
                'id' => $u->id,
                'name' => $u->name,
                'role' => $u->getRoleNames()->first(),
            ])->values()->all();

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
                    'members_count' => $c->participants->count(),
                    'pinned' => $mine?->pinned_at !== null,
                    'muted' => $mine?->muted_at !== null,
                    'title' => $c->type === 'group' ? ($c->title ?: 'محادثة جماعية') : ($others->first() ?? 'محادثة'),
                    'members' => $others->all(),
                    'last_message' => $last?->body,
                    'last_message_at' => ($last?->created_at ?? $c->last_message_at)?->toIso8601String(),
                    'unread' => $unread,
                ];
            })
            // المثبّتة أعلى القائمة، ثم الأحدث رسالةً (ترتيب الاستعلام محفوظ).
            ->sortByDesc(fn (array $c): int => $c['pinned'] ? 1 : 0)
            ->values()
            ->all();

        return $this->ok($conversations);
    }

    /** بحث في رسائل كل محادثاتي — نتيجة مختصرة تنقل إلى موضعها. */
    public function search(Request $request): JsonResponse
    {
        $me = $this->staffOnly($request);
        $term = trim($request->string('q')->toString());
        if (mb_strlen($term) < 2) {
            return $this->ok([]);
        }

        $conversationIds = $me->conversations()->pluck('conversations.id');

        $hits = ConversationMessage::query()
            ->with(['sender:id,name', 'conversation.participants.user:id,name'])
            ->whereIn('conversation_id', $conversationIds)
            ->whereNull('deleted_at')
            ->where('is_system', false)
            ->where('body', 'like', '%'.$term.'%')
            ->orderByDesc('id')
            ->limit(40)
            ->get()
            ->map(function (ConversationMessage $m) use ($me): array {
                $c = $m->conversation;
                $others = $c->participants->where('user_id', '!=', $me->id)->map(fn ($p) => $p->user?->name)->filter();

                return [
                    'message_id' => $m->id,
                    'conversation_id' => $c->id,
                    'conversation_title' => $c->type === 'group' ? ($c->title ?: 'محادثة جماعية') : ($others->first() ?? 'محادثة'),
                    'sender' => $m->sender?->name,
                    'body' => mb_substr((string) $m->body, 0, 160),
                    'at' => $m->created_at?->toIso8601String(),
                ];
            })->all();

        return $this->ok($hits);
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
        $targets = User::whereIn('id', $targetIds)->get();
        if ($targets->contains(fn (User $u): bool => $u->contact_id !== null)) {
            throw ValidationException::withMessages(['user_ids' => 'لا يمكن إضافة حساب عميل إلى الشات الداخلي — استخدم محادثة العملاء.']);
        }
        // إنفاذ صلاحيات التواصل من إعدادات الدور: يُمنع بدء محادثة مع نوع حساب غير مسموح.
        if ($targets->contains(fn (User $u): bool => ! $me->canChatWith($u))) {
            throw ValidationException::withMessages(['user_ids' => 'صلاحيات دورك لا تسمح بالتواصل مع أحد المستخدمين المحدّدين.']);
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

    /**
     * صفّ رسالة داخلية كما تعرضه الواجهة: نصّها ومرفقها وهل قرأها الآخرون.
     *
     * @return array<string, mixed>
     */
    private function messageRow(ConversationMessage $m, int $meId, ?Carbon $othersReadUpTo): array
    {
        $mine = $m->sender_user_id === $meId;
        $deleted = $m->deleted_at !== null;

        return [
            'id' => $m->id,
            'body' => $deleted ? '' : $m->body,
            'deleted' => $deleted,
            'edited' => $m->edited_at !== null,
            // تفاعلات مجمّعة: الرمز وعدده وهل تفاعلتُ به أنا
            'reactions' => $m->reactions->groupBy('emoji')->map(fn ($group, $emoji): array => [
                'emoji' => $emoji,
                'count' => $group->count(),
                'mine' => $group->contains(fn (MessageReaction $r): bool => $r->user_id === $meId),
            ])->values()->all(),
            'mine' => $mine,
            'system' => $m->is_system,
            'sender' => $m->sender?->name,
            'sender_id' => $m->sender_user_id,
            'at' => $m->created_at?->toIso8601String(),
            'file' => $deleted ? null : $this->fileRow($m->file),
            'mentions' => $m->mentions ?? [],
            // التعديل متاح لصاحبها وحده وخلال ربع ساعة من إرسالها
            'editable' => $mine && ! $deleted && ! $m->is_system && $m->created_at?->gt(now()->subMinutes(self::EDIT_WINDOW_MINUTES)),
            // الرسالة المقتبسة: مقتطف منها يكفي لفهم سياق الردّ
            'reply_to' => $m->replyTo === null ? null : [
                'id' => $m->replyTo->id,
                'body' => mb_substr((string) $m->replyTo->body, 0, 140),
                'sender' => $m->replyTo->sender?->name,
                'has_file' => $m->replyTo->file_id !== null,
            ],
            // «قُرئت» لرسائلي وحدها: كل الأعضاء الآخرين اطّلعوا بعد وقت إرسالها.
            'read' => $mine && $othersReadUpTo !== null && $m->created_at !== null && $othersReadUpTo->gte($m->created_at),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function fileRow(?StoredFile $file): ?array
    {
        return $file === null ? null : [
            'id' => $file->id,
            'name' => $file->original_name ?: $file->name,
            'mime' => $file->mime,
            'size' => $file->size,
            'is_image' => str_starts_with((string) $file->mime, 'image/'),
        ];
    }

    /** آخر لحظة اطّلع عندها كل الأعضاء الآخرين (أقدم اطّلاع بينهم). */
    private function othersReadUpTo(Conversation $conversation, int $meId): ?Carbon
    {
        $others = $conversation->participants->where('user_id', '!=', $meId);
        if ($others->isEmpty() || $others->contains(fn ($p): bool => $p->last_read_at === null)) {
            return null;
        }

        return $others->min('last_read_at');
    }

    /** رسائل محادثة داخلية + تعليمها مقروءة. */
    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        $me = $this->staffOnly($request);
        $mine = $conversation->participants()->where('user_id', $me->id)->first();
        abort_if($mine === null, 403, 'لست عضوًا في هذه المحادثة.');

        $search = $request->string('search')->toString();
        $conversation->load('participants');
        $readUpTo = $this->othersReadUpTo($conversation, $me->id);

        /*
         * صفحة واحدة في كل طلب (الأحدث أولًا ثم تُقلب للعرض)، و`before_id`
         * يجلب ما قبلها — فلا تُحمَّل محادثةٌ طويلة كلّها دفعةً واحدة.
         */
        $limit = min(max($request->integer('limit') ?: 50, 10), 100);
        $before = $request->integer('before_id');

        $page = $conversation->messages()
            ->with(['sender:id,name', 'file', 'replyTo.sender:id,name', 'reactions'])
            // بحث في نصّ الرسائل — يعيد المطابق وحده مهما قدُم.
            ->when($search !== '', fn ($q) => $q->where('body', 'like', '%'.$search.'%'))
            ->when($before > 0, fn ($q) => $q->where('id', '<', $before))
            ->orderByDesc('id')
            ->limit($limit + 1)
            ->get();

        $hasMore = $page->count() > $limit;
        $messages = $page->take($limit)->reverse()->values()
            ->map(fn (ConversationMessage $m): array => $this->messageRow($m, $me->id, $readUpTo))
            ->all();

        // البحث وتصفّح الأقدم ليسا قراءةً: لا يُعلّمان المحادثة مقروءة.
        if ($search === '' && $before === 0) {
            $mine->update(['last_read_at' => now()]);
        }

        return $this->ok(['messages' => $messages, 'has_more' => $hasMore]);
    }

    /** إرسال رسالة في محادثة داخلية. */
    public function send(Request $request, Conversation $conversation): JsonResponse
    {
        $me = $this->staffOnly($request);
        $mine = $conversation->participants()->where('user_id', $me->id)->first();
        abort_if($mine === null, 403, 'لست عضوًا في هذه المحادثة.');

        $data = $request->validate([
            'body' => ['required_without_all:file,file_id', 'nullable', 'string', 'max:5000'],
            'file' => ['nullable', 'file', 'max:10240'],
            'reply_to_id' => ['nullable', 'integer'],
            'mentions' => ['nullable', 'array', 'max:20'],
            'mentions.*' => ['integer'],
            // ملف من «مدير الملفات» يُشارَك كما هو بلا رفع نسخة ثانية.
            'file_id' => ['nullable', 'integer', 'exists:stored_files,id'],
        ]);

        $file = $this->resolveAttachment($request, $me, ['folder' => 'chat']);

        // لا يُقتبس إلا من رسائل هذه المحادثة، ولا يُشار إلا إلى أعضائها.
        $replyTo = isset($data['reply_to_id'])
            ? $conversation->messages()->whereKey($data['reply_to_id'])->value('id')
            : null;
        $members = $conversation->participants()->pluck('user_id');
        $mentions = collect($data['mentions'] ?? [])->map(fn ($id): int => (int) $id)
            ->filter(fn (int $id): bool => $members->contains($id))->unique()->values()->all();

        $message = $conversation->messages()->create([
            'sender_user_id' => $me->id,
            'body' => (string) ($data['body'] ?? ''),
            'file_id' => $file?->id,
            'reply_to_id' => $replyTo,
            'mentions' => $mentions ?: null,
        ]);
        $conversation->update(['last_message_at' => $message->created_at]);
        $mine->update(['last_read_at' => now()]);

        $conversation->load('participants');

        return $this->created(
            $this->messageRow($message->load(['sender:id,name', 'file', 'replyTo.sender:id,name', 'reactions']), $me->id, $this->othersReadUpTo($conversation, $me->id)),
            'تم الإرسال',
        );
    }

    /** تعديل نصّ رسالتي خلال مهلة قصيرة — يبقى أثر «عُدّلت». */
    public function editMessage(Request $request, Conversation $conversation, ConversationMessage $message): JsonResponse
    {
        $me = $this->staffOnly($request);
        $this->member($conversation, $me->id);
        abort_if($message->conversation_id !== $conversation->id, 404, 'الرسالة غير موجودة');
        abort_if($message->sender_user_id !== $me->id || $message->is_system, 403, 'لا يمكن تعديل رسالة غيرك.');
        abort_if($message->deleted_at !== null, 422, 'الرسالة محذوفة.');
        abort_if($message->created_at?->lte(now()->subMinutes(self::EDIT_WINDOW_MINUTES)), 422, 'مضت مهلة تعديل الرسالة.');

        $data = $request->validate(['body' => ['required', 'string', 'max:5000']]);
        $message->update(['body' => $data['body'], 'edited_at' => now()]);
        $conversation->load('participants');

        return $this->ok(
            $this->messageRow($message->load(['sender:id,name', 'file', 'replyTo.sender:id,name', 'reactions']), $me->id, $this->othersReadUpTo($conversation, $me->id)),
            'تم تعديل الرسالة',
        );
    }

    /** حذف رسالتي — يبقى موضعها في الخيط بعلامة «حُذفت الرسالة». */
    public function deleteMessage(Request $request, Conversation $conversation, ConversationMessage $message): JsonResponse
    {
        $me = $this->staffOnly($request);
        $this->member($conversation, $me->id);
        abort_if($message->conversation_id !== $conversation->id, 404, 'الرسالة غير موجودة');
        abort_if($message->sender_user_id !== $me->id || $message->is_system, 403, 'لا يمكن حذف رسالة غيرك.');

        $message->update(['deleted_at' => now(), 'body' => '', 'file_id' => null]);

        return $this->ok(null, 'تم حذف الرسالة');
    }

    /** تفاعل سريع على رسالة — الضغط مرّتين يزيله. */
    public function toggleReaction(Request $request, Conversation $conversation, ConversationMessage $message): JsonResponse
    {
        $me = $this->staffOnly($request);
        $this->member($conversation, $me->id);
        abort_if($message->conversation_id !== $conversation->id, 404, 'الرسالة غير موجودة');

        $data = $request->validate(['emoji' => ['required', 'string', Rule::in(self::EMOJIS)]]);
        $existing = MessageReaction::where(['message_id' => $message->id, 'user_id' => $me->id, 'emoji' => $data['emoji']])->first();

        if ($existing !== null) {
            $existing->delete();
        } else {
            MessageReaction::create(['message_id' => $message->id, 'user_id' => $me->id, 'emoji' => $data['emoji']]);
        }

        $conversation->load('participants');

        return $this->ok(
            $this->messageRow($message->load(['sender:id,name', 'file', 'replyTo.sender:id,name', 'reactions']), $me->id, $this->othersReadUpTo($conversation, $me->id)),
            $existing !== null ? 'أُزيل التفاعل' : 'تم التفاعل',
        );
    }

    /** تثبيت المحادثة أعلى قائمتي أو كتم تنبيهها — لكل مستخدم على حدة. */
    public function updatePrefs(Request $request, Conversation $conversation): JsonResponse
    {
        $me = $this->staffOnly($request);
        $this->member($conversation, $me->id);

        $data = $request->validate(['pinned' => ['nullable', 'boolean'], 'muted' => ['nullable', 'boolean']]);
        $participant = $conversation->participants()->where('user_id', $me->id)->first();

        $participant->update(array_filter([
            'pinned_at' => array_key_exists('pinned', $data) ? ($data['pinned'] ? now() : null) : $participant->pinned_at,
            'muted_at' => array_key_exists('muted', $data) ? ($data['muted'] ? now() : null) : $participant->muted_at,
        ], fn ($v): bool => true));

        return $this->ok([
            'pinned' => $participant->fresh()->pinned_at !== null,
            'muted' => $participant->fresh()->muted_at !== null,
        ], 'تم حفظ التفضيل');
    }

    /** تعديل اسم المحادثة الجماعية — لأي عضو فيها. */
    public function renameConversation(Request $request, Conversation $conversation): JsonResponse
    {
        $me = $this->staffOnly($request);
        $this->member($conversation, $me->id);
        abort_if($conversation->type !== 'group', 422, 'الاسم للمحادثات الجماعية فقط.');

        $data = $request->validate(['title' => ['required', 'string', 'min:2', 'max:120']]);
        $old = $conversation->title;
        $conversation->update(['title' => $data['title']]);
        $this->systemMessage($conversation, "غيّر {$me->name} اسم المجموعة من «{$old}» إلى «{$data['title']}»");

        return $this->ok(['id' => $conversation->id, 'title' => $conversation->title], 'تم تغيير اسم المجموعة');
    }

    /** إضافة أعضاء إلى محادثة جماعية — بحدود صلاحيات التواصل. */
    public function addParticipants(Request $request, Conversation $conversation): JsonResponse
    {
        $me = $this->staffOnly($request);
        $this->member($conversation, $me->id);
        abort_if($conversation->type !== 'group', 422, 'الإضافة للمحادثات الجماعية فقط.');

        $data = $request->validate([
            'user_ids' => ['required', 'array', 'min:1', 'max:50'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $targets = User::whereIn('id', $data['user_ids'])->get();
        if ($targets->contains(fn (User $u): bool => $u->contact_id !== null || ! $me->canChatWith($u))) {
            throw ValidationException::withMessages(['user_ids' => 'لا يمكن إضافة أحد المستخدمين المحدّدين إلى هذه المحادثة.']);
        }

        $existing = $conversation->participants()->pluck('user_id');
        $added = $targets->reject(fn (User $u): bool => $existing->contains($u->id));
        $conversation->participants()->createMany($added->map(fn (User $u): array => ['user_id' => $u->id])->all());

        if ($added->isNotEmpty()) {
            $this->systemMessage($conversation, "أضاف {$me->name}: ".$added->pluck('name')->join('، '));
        }

        return $this->ok(['added' => $added->count()], $added->isEmpty() ? 'الأعضاء موجودون أصلًا' : 'تمت الإضافة');
    }

    /** إخراج عضو من محادثة جماعية. */
    public function removeParticipant(Request $request, Conversation $conversation, User $user): JsonResponse
    {
        $me = $this->staffOnly($request);
        $this->member($conversation, $me->id);
        abort_if($conversation->type !== 'group', 422, 'الإخراج للمحادثات الجماعية فقط.');
        abort_if($user->id === $me->id, 422, 'لمغادرة المحادثة استخدم «مغادرة».');

        $removed = $conversation->participants()->where('user_id', $user->id)->delete();
        if ($removed > 0) {
            $this->systemMessage($conversation, "أخرج {$me->name} {$user->name} من المجموعة");
        }

        return $this->ok(null, 'تم إخراج العضو');
    }

    /** مغادرة محادثة جماعية — تختفي من قائمتي وتبقى لبقيّة الأعضاء. */
    public function leaveConversation(Request $request, Conversation $conversation): JsonResponse
    {
        $me = $this->staffOnly($request);
        $this->member($conversation, $me->id);
        abort_if($conversation->type !== 'group', 422, 'المغادرة للمحادثات الجماعية فقط.');

        $conversation->participants()->where('user_id', $me->id)->delete();
        $this->systemMessage($conversation, "غادر {$me->name} المجموعة");

        return $this->ok(null, 'غادرت المحادثة');
    }

    /** تنزيل مرفق رسالة داخلية — لأعضاء المحادثة وحدهم. */
    public function downloadMessageFile(Request $request, Conversation $conversation, ConversationMessage $message): StreamedResponse
    {
        $me = $this->staffOnly($request);
        $this->member($conversation, $me->id);
        abort_if($message->conversation_id !== $conversation->id || $message->file === null, 404, 'المرفق غير موجود');

        return $this->streamFile($message->file);
    }

    /** تنزيل مرفق رسالة عميل — لطاقم معمار. */
    public function downloadClientFile(Request $request, Contact $contact, ClientMessage $message): StreamedResponse
    {
        $this->staffOnly($request);
        abort_if($message->contact_id !== $contact->id || $message->file === null, 404, 'المرفق غير موجود');

        return $this->streamFile($message->file);
    }

    private function streamFile(StoredFile $file): StreamedResponse
    {
        abort_unless(Storage::disk($file->disk)->exists($file->path), 404, 'الملف غير موجود على القرص');

        // الصور تُعرض داخل المحادثة، وغيرها يُنزَّل باسمه الأصلي.
        return str_starts_with((string) $file->mime, 'image/')
            ? Storage::disk($file->disk)->response($file->path, $file->original_name)
            : Storage::disk($file->disk)->download($file->path, $file->original_name);
    }

    /**
     * مرفق الرسالة: ملفٌ مرفوع الآن، أو ملف قائم من مدير الملفات يملك
     * المستخدم حقّ الاطّلاع عليه.
     *
     * @param  array<string, mixed>  $meta
     */
    private function resolveAttachment(Request $request, User $me, array $meta): ?StoredFile
    {
        if ($request->hasFile('file')) {
            return $this->files->store($request->file('file'), $meta, $me->id);
        }

        $id = $request->integer('file_id');
        if ($id === 0) {
            return null;
        }

        $file = StoredFile::findOrFail($id);
        abort_unless($this->files->canAccess($file, $me), 403, 'لا تملك صلاحية مشاركة هذا الملف.');

        return $file;
    }

    /** يتأكّد أن المستخدم عضو في المحادثة، وإلا 403. */
    private function member(Conversation $conversation, int $userId): void
    {
        abort_if($conversation->participants()->where('user_id', $userId)->doesntExist(), 403, 'لست عضوًا في هذه المحادثة.');
    }

    /** سطر نظام داخل المحادثة يوثّق حركة المجموعة (بلا مُرسِل). */
    private function systemMessage(Conversation $conversation, string $body): void
    {
        $message = $conversation->messages()->create(['sender_user_id' => null, 'body' => $body, 'is_system' => true]);
        $conversation->update(['last_message_at' => $message->created_at]);
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
            ->with('file')
            ->orderBy('created_at')
            ->limit(500)
            ->get()
            ->map(fn (ClientMessage $m): array => [
                'id' => $m->id,
                'body' => $m->body,
                'from_staff' => $m->from_staff,
                'at' => $m->created_at?->toIso8601String(),
                'file' => $this->fileRow($m->file),
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
        $data = $request->validate([
            'body' => ['required_without_all:file,file_id', 'nullable', 'string', 'max:5000'],
            'file' => ['nullable', 'file', 'max:10240'],
            'file_id' => ['nullable', 'integer', 'exists:stored_files,id'],
        ]);

        $file = $this->resolveAttachment($request, $me, ['folder' => 'chat', 'contact_id' => $contact->id]);

        $message = ClientMessage::create([
            'contact_id' => $contact->id,
            'from_staff' => true,
            'body' => (string) ($data['body'] ?? ''),
            'sender_user_id' => $me->id,
            'file_id' => $file?->id,
        ]);

        return $this->created([
            'id' => $message->id,
            'body' => $message->body,
            'from_staff' => true,
            'at' => $message->created_at?->toIso8601String(),
            'file' => $this->fileRow($file),
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

        return $this->ok([
            'internal' => $internal,
            'client_awaiting' => $clientAwaiting,
            'mentions' => $this->unreadMentions($me->id),
        ]);
    }

    /** رسائل تُشير إليّ ولم أقرأها بعد — لها تنبيهها الخاصّ في الجرس. */
    public function unreadMentions(int $userId): int
    {
        return ConversationMessage::query()
            ->whereJsonContains('mentions', $userId)
            ->where('sender_user_id', '!=', $userId)
            ->whereIn('conversation_id', function ($q) use ($userId): void {
                $q->select('conversation_id')->from('conversation_participants')->where('user_id', $userId);
            })
            ->whereRaw(
                'conversation_messages.created_at > coalesce((select last_read_at from conversation_participants'
                .' where conversation_participants.conversation_id = conversation_messages.conversation_id'
                .' and conversation_participants.user_id = ?), ?)',
                [$userId, '1970-01-01 00:00:00'],
            )
            ->count();
    }
}
