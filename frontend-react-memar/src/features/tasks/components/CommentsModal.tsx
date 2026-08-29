import { type CSSProperties, type FormEvent, useEffect, useRef, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { personColor, personInitials } from '../../crm/types';
import { useAddCardComment, useCardComments, type CardRef } from '../hooks/useCardActivity';

interface Props {
  /** البطاقة: مهمة أو متابعة. */
  card: CardRef;
  /** يكتب تعليقًا (tasks.manage) — بدونها النافذة للقراءة. */
  canComment: boolean;
  onClose: () => void;
}

const stamp = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '';

/**
 * نافذة تعليقات المهمة (طلب أيمن 2026-08-29): تعليقات هذه المهمة وحدها بتواريخها،
 * لا محادثة عامّة ولا تفاصيل مهمة. آخر تعليق يظهر فور كتابته على البطاقة.
 */
export function CommentsModal({ card, canComment, onClose }: Props) {
  const { data: comments, isLoading } = useCardComments(card);
  const add = useAddCardComment(card);

  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  const list = comments ?? [];

  // التعليق الأحدث في الأسفل — ننزل إليه عند الفتح وبعد كل إضافة.
  useEffect(() => {
    if (isLoading) return;
    endRef.current?.scrollIntoView({ block: 'nearest' });
    input.current?.focus({ preventScroll: true });
  }, [isLoading, list.length]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setError('');
    add.mutate(text, {
      onSuccess: () => setBody(''),
      onError: (err) => setError(apiErrorMessage(err)),
    });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={head}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: '16px' }}>💬 تعليقات المهمة</h2>
            <div style={sub}>
              {card.code} · {card.title}
              {list.length > 0 && <> · {list.length} تعليق</>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" style={closeBtn}>×</button>
        </div>

        <div style={thread}>
          {isLoading && <p style={muted}>جارٍ التحميل…</p>}
          {!isLoading && list.length === 0 && <p style={muted}>لا تعليقات بعد — اكتب أوّل تعليق.</p>}
          {list.map((c) => (
            <div key={c.id} style={row}>
              <span
                title={c.user?.name ?? 'مستخدم'}
                style={{ ...avatar, background: c.user ? personColor(c.user.id) : '#94A3B8' }}
              >{personInitials(c.user?.name ?? '؟')}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={rowHead}>
                  <b style={{ color: '#0F2A4A' }}>{c.user?.name ?? 'مستخدم'}</b>
                  <span style={muted}>{stamp(c.created_at)}</span>
                </div>
                <div style={bodyText}>{c.body}</div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {error && <p style={{ color: '#DC4A3D', fontSize: '12.5px', margin: '8px 0 0' }}>{error}</p>}

        {canComment ? (
          <form onSubmit={submit} style={formBox}>
            <textarea
              ref={input}
              className="input"
              rows={2}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="اكتب تعليقك على المهمة…"
              style={area}
            />
            <button type="submit" className="btn btn-primary" disabled={add.isPending || !body.trim()}>
              {add.isPending ? 'جارٍ الإرسال…' : '💬 إضافة التعليق'}
            </button>
          </form>
        ) : (
          <p style={{ ...muted, marginTop: '12px' }}>العرض فقط — كتابة التعليقات تحتاج صلاحية الإدارة.</p>
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
const thread: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '46vh', overflowY: 'auto' };
const row: CSSProperties = { display: 'flex', gap: '9px', alignItems: 'flex-start', background: '#F8FAFC', border: '1px solid #EEF2F7', borderRadius: '11px', padding: '9px 11px' };
const avatar: CSSProperties = { width: '28px', height: '28px', borderRadius: '50%', color: '#fff', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const rowHead: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '11.5px', marginBottom: '3px' };
const bodyText: CSSProperties = { fontSize: '13px', color: '#1E293B', lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word' };
const muted: CSSProperties = { fontSize: '11.5px', color: '#94A3B8' };
const formBox: CSSProperties = { marginTop: '14px', borderTop: '1px solid #EEF2F7', paddingTop: '12px' };
const area: CSSProperties = { width: '100%', marginBottom: '8px', fontFamily: 'inherit', resize: 'vertical' };
