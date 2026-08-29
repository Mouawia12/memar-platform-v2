import { type CSSProperties, type FormEvent, useEffect, useRef, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useDirectives, useReplyDirective, useSendDirective, type CardRef } from '../hooks/useCardActivity';
import type { TaskDirective } from '../types';

interface Props {
  /** البطاقة: مهمة أو متابعة — الخيط واحد والمسار يختلف. */
  card: CardRef;
  /** يرسل توجيهًا جديدًا (الإدارة — tasks.delete). */
  canSend: boolean;
  /** يردّ على التوجيه (المكلَّف بالمهمة أو أحد المشاركين). */
  canReply: boolean;
  onClose: () => void;
}

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '';

/**
 * توجيهات الإدارة على المهمة (طلب أيمن 2026-08-29): المدير يكتب ملاحظته على
 * بطاقة الموظف، والموظف يردّ فتُختم بـ«تم الرد». التوجيه المردود عليه لا يُعاد
 * فتحه — «إرسال من جديد» يبدأ توجيهًا جديدًا يحفظ الخيط كاملًا.
 */
export function DirectiveModal({ card, canSend, canReply, onClose }: Props) {
  const { data: directives, isLoading } = useDirectives(card);
  const send = useSendDirective(card);
  const reply = useReplyDirective(card);

  // فتح الخيط يُعلّم الردود كمرئية على الخادم → نُنعش اللوحة عند الإغلاق كي
  // تنطفئ نقطة «تم الرد» الحمراء عن البطاقة.
  // الضغط على شارة البطاقة يقصد الردّ نفسه: ننزل إليه إن وُجد، وإلا نُجهّز حقل
  // الردّ لمن ينتظره الردّ (طلب أيمن 2026-08-29).
  const replyRef = useRef<HTMLDivElement>(null);
  const replyInput = useRef<HTMLTextAreaElement>(null);

  const [body, setBody] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [error, setError] = useState('');

  const list = directives ?? [];
  const ready = !isLoading && list.length > 0;
  const latest: TaskDirective | undefined = list[0];
  // الردّ متاح على آخر توجيه وحده — التوجيه القديم أُغلق بالتوجيه الذي بعده.
  const awaiting = latest && !latest.replied ? latest : null;
  const showReplyForm = canReply && awaiting !== null;

  useEffect(() => {
    if (!ready) return;
    if (replyRef.current) {
      replyRef.current.scrollIntoView({ block: 'nearest' });

      return;
    }
    replyInput.current?.focus({ preventScroll: true });
  }, [ready]);

  const submitSend = (e: FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setError('');
    send.mutate(text, {
      onSuccess: () => setBody(''),
      onError: (err) => setError(apiErrorMessage(err)),
    });
  };

  const submitReply = (e: FormEvent) => {
    e.preventDefault();
    const text = replyBody.trim();
    if (!text || !awaiting) return;
    setError('');
    reply.mutate({ id: awaiting.id, body: text }, {
      onSuccess: () => setReplyBody(''),
      onError: (err) => setError(apiErrorMessage(err)),
    });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={head}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: '16px' }}>📣 توجيهات المهمة</h2>
            <div style={sub}>
              {card.code} · {card.title}
              {card.owner && <> · {card.ownerLabel ?? 'المكلَّف'}: <b style={{ color: '#334155' }}>{card.owner}</b></>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" style={closeBtn}>×</button>
        </div>

        {/* ── خيط التوجيهات ── */}
        <div style={thread}>
          {isLoading && <p style={muted}>جارٍ التحميل…</p>}
          {!isLoading && list.length === 0 && (
            <p style={muted}>لا توجيهات على هذه المهمة بعد.</p>
          )}
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

              {d.replied && (
                <div ref={i === 0 ? replyRef : undefined} style={replyBox}>
                  <div style={bubbleHead}>
                    <span style={{ fontWeight: 800, color: '#166534' }}>↩️ {d.replier?.name ?? 'الموظف'}</span>
                    <span style={muted}>{fmt(d.replied_at)}</span>
                  </div>
                  <div style={bodyText}>{d.reply_body}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {error && <p style={{ color: '#DC4A3D', fontSize: '12.5px', margin: '8px 0 0' }}>{error}</p>}

        {/* ── ردّ الموظف على آخر توجيه ── */}
        {showReplyForm && (
          <form onSubmit={submitReply} style={formBox}>
            <label style={formLabel}>ردّك على التوجيه</label>
            <textarea
              ref={replyInput}
              className="input"
              rows={2}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="اكتب ردّك… مثال: جارٍ العمل عليها، تُسلَّم غدًا."
              style={area}
            />
            <button type="submit" className="btn btn-primary" disabled={reply.isPending || !replyBody.trim()}>
              {reply.isPending ? 'جارٍ الإرسال…' : '↩️ إرسال الردّ'}
            </button>
          </form>
        )}

        {/* ── توجيه جديد من الإدارة ── */}
        {canSend && (
          <form onSubmit={submitSend} style={formBox}>
            <label style={formLabel}>{list.length > 0 ? 'توجيه جديد' : 'اكتب توجيهك للموظف'}</label>
            <textarea
              className="input"
              rows={2}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="مثال: أنجز هذه المهمة بسرعة — العميل ينتظر التسليم اليوم."
              style={area}
            />
            <button type="submit" className="btn btn-primary" disabled={send.isPending || !body.trim()}>
              {send.isPending ? 'جارٍ الإرسال…' : list.length > 0 ? '📤 إرسال من جديد' : '📤 إرسال التوجيه'}
            </button>
          </form>
        )}

        {/* لا نافذة صامتة: من لا يملك نموذجًا يُقال له لماذا. */}
        {!showReplyForm && !canSend && (
          <p style={{ ...muted, marginTop: '12px' }}>
            {canReply
              ? 'لا يوجد توجيه بانتظار ردّك — الإرسال من صلاحية الإدارة.'
              : 'العرض فقط — إرسال التوجيه للإدارة، والردّ للمكلَّف بالمهمة.'}
          </p>
        )}
      </div>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,25,45,0.45)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', zIndex: 11000, padding: '20px' };
const modal: CSSProperties = { padding: '20px 22px', width: '100%', maxWidth: '520px', maxHeight: '88vh', overflow: 'auto' };
const head: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' };
const sub: CSSProperties = { fontSize: '12px', color: '#8A93A3', marginTop: '3px' };
const closeBtn: CSSProperties = { background: 'none', border: 'none', fontSize: '24px', lineHeight: 1, cursor: 'pointer', color: '#94A3B8', fontFamily: 'inherit' };
const thread: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '9px', maxHeight: '38vh', overflowY: 'auto', paddingLeft: '2px' };
const bubble: CSSProperties = { background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '11px', padding: '10px 12px' };
// آخر توجيه هو المعنيّ بالردّ، فيُبرَز عن سابقيه.
const bubbleLatest: CSSProperties = { background: '#FFFBEB', borderColor: '#FCD34D' };
const bubbleHead: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '11.5px', marginBottom: '5px' };
const bodyText: CSSProperties = { fontSize: '13px', color: '#1E293B', lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word' };
const muted: CSSProperties = { fontSize: '11.5px', color: '#94A3B8' };
const state: CSSProperties = { marginInlineStart: 'auto', fontSize: '10.5px', fontWeight: 900, borderRadius: '999px', padding: '2px 9px', whiteSpace: 'nowrap' };
const statePending: CSSProperties = { background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' };
const stateDone: CSSProperties = { background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' };
const replyBox: CSSProperties = { marginTop: '8px', borderInlineStart: '3px solid #86EFAC', background: '#F0FDF4', borderRadius: '9px', padding: '8px 10px' };
const formBox: CSSProperties = { marginTop: '14px', borderTop: '1px solid #EEF2F7', paddingTop: '12px' };
const formLabel: CSSProperties = { display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '5px' };
const area: CSSProperties = { width: '100%', marginBottom: '8px', fontFamily: 'inherit', resize: 'vertical' };
