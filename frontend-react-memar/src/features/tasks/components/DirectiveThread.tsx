import { type CSSProperties, type FormEvent, useEffect, useRef, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { personColor, personInitials } from '../../crm/types';
import { useAddDirectiveMessage, useDirectives, useSendDirective, type CardRef } from '../hooks/useCardActivity';
import type { TaskDirective } from '../types';

interface Props {
  /** البطاقة: مهمة أو متابعة أو فرصة — الخيط واحد والمسار يختلف. */
  card: CardRef;
  /** يبدأ توجيهًا جديدًا (الإدارة). */
  canSend: boolean;
  /** طرفٌ في الخيط: صاحب البطاقة أو مُرسِل التوجيه — يردّ ويردّ على الردّ. */
  canReply: boolean;
  /** ارتفاع منطقة الرسائل — تُوسَّع حين يسكن الخيط داخل تبويب لا نافذة. */
  maxHeight?: string;
}

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '';

/**
 * خيط التوجيه: المدير يوجّه، وصاحب البطاقة يردّ، والمدير يردّ على ردّه.
 * استُخرج من «DirectiveModal» ليُعرض كما هو داخل تبويب «المحادثة» في تفاصيل
 * الفرصة أيضًا (طلب أيمن 2026-09-17) — خيطٌ واحد لا خيطان.
 */
export function DirectiveThread({ card, canSend, canReply, maxHeight = '42vh' }: Props) {
  const { data: directives, isLoading } = useDirectives(card);
  const send = useSendDirective(card);
  const addMessage = useAddDirectiveMessage(card);

  const [body, setBody] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const replyInput = useRef<HTMLTextAreaElement>(null);

  const list = directives ?? [];
  const latest: TaskDirective | undefined = list[0];
  const ready = !isLoading && list.length > 0;

  // الردّ يكون على الخيط الأحدث — ننزل إلى آخر رسالة فيه ونُجهّز حقل الردّ.
  useEffect(() => {
    if (!ready) return;
    endRef.current?.scrollIntoView({ block: 'nearest' });
    replyInput.current?.focus({ preventScroll: true });
  }, [ready, latest?.messages.length]);

  const submitSend = (e: FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setError('');
    send.mutate(text, { onSuccess: () => setBody(''), onError: (err) => setError(apiErrorMessage(err)) });
  };

  const submitReply = (e: FormEvent) => {
    e.preventDefault();
    const text = replyBody.trim();
    if (!text || !latest) return;
    setError('');
    addMessage.mutate({ id: latest.id, body: text }, {
      onSuccess: () => setReplyBody(''),
      onError: (err) => setError(apiErrorMessage(err)),
    });
  };

  return (
    <>
      <div style={{ ...thread, maxHeight }}>
        {isLoading && <p style={muted}>جارٍ التحميل…</p>}
        {!isLoading && list.length === 0 && <p style={muted}>لا توجيهات على هذه البطاقة بعد.</p>}

        {list.map((d, i) => (
          <div key={d.id} style={{ ...bubble, ...(i === 0 ? bubbleLatest : null) }}>
            <div style={bubbleHead}>
              <span style={{ fontWeight: 800, color: '#0F2A4A' }}>{d.sender?.name ?? 'الإدارة'}</span>
              <span style={muted}>{fmt(d.created_at)}</span>
              <span style={{ ...state, ...(d.replied ? stateDone : statePending) }}>
                {d.replied ? '✅ تم الرد' : '⏳ بانتظار الرد'}
              </span>
            </div>
            <div style={bodyText}>{d.body}</div>

            {/* الردود وردود الردود — بترتيب المحادثة تحت التوجيه. */}
            {d.messages.map((m) => (
              <div key={m.id} style={{ ...replyBox, ...(m.user?.id === d.sender?.id ? replyBoxSender : null) }}>
                <div style={bubbleHead}>
                  <span
                    title={m.user?.name ?? 'مستخدم'}
                    style={{ ...avatar, background: m.user ? personColor(m.user.id) : '#94A3B8' }}
                  >{personInitials(m.user?.name ?? '؟')}</span>
                  <b style={{ color: '#334155' }}>{m.user?.name ?? 'مستخدم'}</b>
                  <span style={muted}>{fmt(m.created_at)}</span>
                </div>
                <div style={bodyText}>{m.body}</div>
              </div>
            ))}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {error && <p style={{ color: '#DC4A3D', fontSize: '12.5px', margin: '8px 0 0' }}>{error}</p>}

      {/* ردّ على الخيط الأحدث — لأطرافه، ومفتوح مهما تعدّدت الردود. */}
      {canReply && latest && (
        <form onSubmit={submitReply} style={formBox}>
          <label style={formLabel}>↩️ ردّك على آخر رسالة</label>
          <textarea
            ref={replyInput}
            className="input"
            rows={2}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="اكتب ردّك… مثال: جارٍ العمل عليها، تُسلَّم غدًا."
            style={area}
          />
          <button type="submit" className="btn btn-primary" disabled={addMessage.isPending || !replyBody.trim()}>
            {addMessage.isPending ? 'جارٍ الإرسال…' : '↩️ إرسال الردّ'}
          </button>
        </form>
      )}

      {canSend && (
        <form onSubmit={submitSend} style={formBox}>
          <label style={formLabel}>{list.length > 0 ? 'توجيه جديد (موضوع آخر)' : 'اكتب توجيهك'}</label>
          <textarea
            className="input"
            rows={2}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="مثال: أنجز هذه المهمة بسرعة — العميل ينتظر التسليم اليوم."
            style={area}
          />
          <button type="submit" className="btn btn-primary" disabled={send.isPending || !body.trim()}>
            {send.isPending ? 'جارٍ الإرسال…' : list.length > 0 ? '📤 توجيه جديد' : '📤 إرسال التوجيه'}
          </button>
        </form>
      )}

      {/* لا نافذة صامتة: من لا يملك نموذجًا يُقال له لماذا. */}
      {!canSend && !(canReply && latest) && (
        <p style={{ ...muted, marginTop: '12px' }}>العرض فقط — المشاركة في الخيط لأطرافه.</p>
      )}
    </>
  );
}

const thread: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '9px', overflowY: 'auto', paddingLeft: '2px' };
const bubble: CSSProperties = { background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '11px', padding: '10px 12px' };
// الخيط الأحدث هو المعنيّ بالردّ، فيُبرَز عن سابقيه.
const bubbleLatest: CSSProperties = { background: '#FFFBEB', borderColor: '#FCD34D' };
const bubbleHead: CSSProperties = { display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', fontSize: '11.5px', marginBottom: '5px' };
const avatar: CSSProperties = { width: '20px', height: '20px', borderRadius: '50%', color: '#fff', fontSize: '8px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const bodyText: CSSProperties = { fontSize: '13px', color: '#1E293B', lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word' };
const muted: CSSProperties = { fontSize: '11.5px', color: '#94A3B8' };
const state: CSSProperties = { marginInlineStart: 'auto', fontSize: '10.5px', fontWeight: 900, borderRadius: '999px', padding: '2px 9px', whiteSpace: 'nowrap' };
const statePending: CSSProperties = { background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' };
const stateDone: CSSProperties = { background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' };
// ردّ صاحب البطاقة أخضر، وردّ المُرسِل عليه أزرق — يُقرأ الدور من اللون.
const replyBox: CSSProperties = { marginTop: '8px', borderInlineStart: '3px solid #86EFAC', background: '#F0FDF4', borderRadius: '9px', padding: '8px 10px' };
const replyBoxSender: CSSProperties = { borderInlineStartColor: '#9DC4E4', background: '#F5FAFF' };
const formBox: CSSProperties = { marginTop: '14px', borderTop: '1px solid #EEF2F7', paddingTop: '12px' };
const formLabel: CSSProperties = { display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '5px' };
const area: CSSProperties = { width: '100%', marginBottom: '8px', fontFamily: 'inherit', resize: 'vertical' };
